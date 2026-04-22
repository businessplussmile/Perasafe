
import React, { useState, useEffect, useMemo } from 'react';
import { SecureDocument } from '../types';
import { useSecurity } from '../hooks/useSecurity';
import { decryptContent } from '../services/documentService';
import { Sparkles, Camera, AlertTriangle } from 'lucide-react';
import { useCameraLeakDetection } from '../hooks/useCameraLeakDetection';

interface SecureViewerProps {
  document: SecureDocument;
  onExit: () => void;
  isAdmin?: boolean;
  onDelete?: () => void;
}

const LIFESPAN_MS = 24 * 60 * 60 * 1000;

const DECRYPTION_STEPS = [
  "Initialisation du protocole X-14...",
  "Calcul de l'entropie locale...",
  "Déchiffrement des couches asymétriques...",
  "Vérification de l'intégrité du package...",
  "Extraction du contenu sécurisé..."
];

const SecureViewer: React.FC<SecureViewerProps> = ({ document: doc, onExit, isAdmin, onDelete }) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    const start = doc.lifespanStart || Date.now();
    const elapsed = Date.now() - start;
    return Math.max(0, Math.floor((LIFESPAN_MS - elapsed) / 1000));
  }); 
  const [isBlurred, setIsBlurred] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isReading, setIsReading] = useState(true);

  // Initialiser la détection de fuite (anti-téléphone)
  const { cameraEnabled, leakDetected } = useCameraLeakDetection(doc.id, doc.uploaderId, "Partenaire");

  // Le hook de sécurité pilote l'état de floutage
  useSecurity(true, (triggered) => {
    setIsBlurred(triggered);
  });

  const decryptedBody = useMemo(() => {
    if (isReading && loadingProgress < 100) return "";
    return decryptContent(doc.content, doc.accessCode);
  }, [doc.content, doc.accessCode, isReading, loadingProgress]);

  const currentStep = useMemo(() => {
    const stepIndex = Math.floor((loadingProgress / 101) * DECRYPTION_STEPS.length);
    return DECRYPTION_STEPS[stepIndex] || DECRYPTION_STEPS[DECRYPTION_STEPS.length - 1];
  }, [loadingProgress]);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 15;
      if (current >= 100) {
        setLoadingProgress(100);
        setTimeout(() => setIsReading(false), 600);
        clearInterval(interval);
      } else {
        setLoadingProgress(current);
      }
    }, 150);

    const timer = setInterval(() => {
      const start = doc.lifespanStart || Date.now();
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, Math.floor((LIFESPAN_MS - elapsed) / 1000));
      
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        alert("ALERTE : Cycle de vie expiré. Destruction du contenu.");
        onExit();
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [onExit, doc.lifespanStart]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  if (isReading) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#f8fafc] flex flex-col items-center justify-center text-center p-8 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `radial-gradient(#643012 1px, transparent 1px)`, backgroundSize: '30px 30px' }}></div>
        <div className="relative mb-12">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-slate-100 flex items-center justify-center relative shadow-inner bg-white">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="48%"
                fill="none"
                stroke="#643012"
                strokeWidth="2"
                strokeDasharray="1000"
                strokeDashoffset={1000 - (loadingProgress * 10)}
                className="transition-all duration-300 ease-out"
              />
            </svg>
            <div className="relative z-10 flex flex-col items-center">
              <i className="fas fa-fingerprint text-3xl md:text-4xl text-[#643012] animate-pulse"></i>
              <span className="text-[10px] font-black text-[#643012] mt-2">{Math.round(loadingProgress)}%</span>
            </div>
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-full pointer-events-none">
               <div className="w-full h-[2px] bg-[#F2AF31]/50 shadow-[0_0_15px_#F2AF31] absolute top-0 animate-[scan_2s_infinite_linear]"></div>
            </div>
          </div>
        </div>
        <div className="space-y-4 max-w-xs mx-auto">
          <h2 className="text-slate-900 text-sm md:text-base font-black uppercase tracking-[0.3em] animate-pulse">DÉCHIFFREMENT</h2>
          <div className="h-1 bg-slate-200 w-full rounded-full overflow-hidden">
            <div className="h-full bg-[#643012] transition-all duration-300" style={{ width: `${loadingProgress}%` }}></div>
          </div>
          <p className="text-[#643012] text-[9px] font-bold uppercase tracking-widest min-h-[1.5em] opacity-60">
            {currentStep}
          </p>
        </div>
        <style>{`
          @keyframes scan {
            0% { transform: translateY(0); opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { transform: translateY(160px); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#f8fafc] flex flex-col overflow-hidden animate-fade-in no-print">
      <header className="bg-white px-4 md:px-12 py-3 md:py-4 flex justify-between items-center z-50 border-b border-slate-200/50 shadow-sm">
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={onExit} 
            className="bg-slate-900 text-white px-4 md:px-6 py-2.5 rounded-xl md:rounded-2xl transition-all btn-active flex items-center gap-2 md:gap-3"
          >
            <i className="fas fa-chevron-left text-[10px]"></i>
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">FERMER</span>
          </button>
          {isAdmin && onDelete && (
            <button onClick={onDelete} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-xl md:rounded-2xl border border-red-100">
              <i className="fas fa-trash-can text-sm"></i>
            </button>
          )}
          <div className="hidden lg:flex items-center gap-3 ml-4">
            <h1 className="text-sm font-black text-slate-900 uppercase truncate max-w-md">{doc.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-6">
           <div className="flex flex-col items-end">
             <span className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest text-red-500 animate-pulse">Auto-Destruction dans</span>
             <p className={`font-mono text-lg md:text-xl font-black ${timeLeft < 3600 ? 'text-red-600' : 'text-slate-900'}`}>
                {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
             </p>
           </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-0 md:p-0 relative custom-scrollbar bg-slate-200/50 backdrop-blur-sm">
        {/* Overlay de Sécurité Actif */}
        {(isBlurred || leakDetected) && (
          <div className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-[40px] flex flex-col items-center justify-center text-center p-8 animate-fade-in">
            <div className={`w-20 h-20 ${leakDetected ? 'bg-orange-600' : 'bg-red-600'} text-white rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl animate-pulse`}>
              {leakDetected ? <Camera className="w-8 h-8" /> : <i className="fas fa-eye-slash text-3xl"></i>}
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter">
              {leakDetected ? "ALERTE DE TENTATIVE DE FUITE" : "Confidentialité Suspendue"}
            </h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-4 mb-4">
              {leakDetected ? "Un téléphone ou une caméra a été détecté devant l'écran." : "Capture d'écran ou perte de focus détectée"}
            </p>
            {leakDetected ? (
               <div className="bg-orange-100/50 border border-orange-200 text-orange-800 p-4 rounded-xl text-xs max-w-sm font-semibold mb-10 flex items-start gap-4 text-left">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-orange-600" />
                  <div>
                    Par mesure de sécurité, l'accès à ce document a été verrouillé. Un signal vient d'être transmis au propriétaire du document ainsi qu'à l'équipe d'administration (jorisahoussi4@gmail.com).
                  </div>
               </div>
            ) : (
               <button 
                 onClick={() => setIsBlurred(false)} 
                 className="px-12 py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl btn-active mb-10"
               >
                 Reprendre la lecture sécurisée
               </button>
            )}
          </div>
        )}

        <div className={`w-full relative transition-all duration-500 ${(isBlurred || leakDetected) ? 'filter blur-[50px] scale-105 pointer-events-none' : 'filter blur-0 scale-100'}`}>
          <div className="relative bg-white min-h-screen shadow-2xl p-0 flex flex-col relative overflow-hidden">
             
             <div className="h-4 md:h-6 bg-[#643012] w-full"></div>

             <div className="absolute inset-0 pointer-events-none select-none opacity-[0.02] z-0" 
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='500' height='250' viewBox='0 0 500 250' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='0' y='120' font-family='sans-serif' font-weight='900' font-size='14' fill='black' transform='rotate(-20 50 120)'%3EPERAFIND STRATEGIC INTELLIGENCE%3C/text%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat'
                  }} 
             />
             
             <div className="relative z-10 flex-1 px-8 md:px-24 lg:px-40">
                <div className="pt-16 pb-12 flex flex-col items-center">
                   <div className="bg-[#F2AF31] rounded-full px-8 py-2.5 flex items-center gap-3 shadow-md mb-16">
                      <i className="fas fa-shield-halved text-[#643012] text-xs"></i>
                      <span className="text-[#643012] text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em]">Niveau 5 Executive Access</span>
                   </div>

                   <div className="max-w-4xl text-center">
                      <p className="text-[#8fa1b4] text-[9px] md:text-[11px] font-bold uppercase tracking-[0.15em] leading-[1.8] opacity-80">
                         CE DOCUMENT EST LA PROPRIÉTÉ EXCLUSIVE DE PERAFIND. TOUTE REPRODUCTION OU DIVULGATION CONSTITUE UNE FAUTE GRAVE.
                      </p>
                   </div>

                   {doc.summary && (
                     <div className="mt-12 w-full max-w-2xl bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 flex gap-4 items-start animate-fade-in shadow-inner">
                        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
                           <Sparkles className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                           <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block mb-1">Analyse Stratégique Automatisée</span>
                           <p className="text-[13px] text-slate-700 leading-relaxed font-medium italic">"{doc.summary}"</p>
                        </div>
                     </div>
                   )}

                   <div className="w-full h-[1px] bg-slate-100 mt-16 max-w-6xl mx-auto"></div>
                </div>

                <div className="text-[#1e293b] font-serif text-lg md:text-[24px] leading-[2] select-none rich-text-viewer py-12"
                   dangerouslySetInnerHTML={{ __html: decryptedBody }}
                />
             </div>

             <div className="mt-32 pt-16 pb-12 border-t border-slate-50 flex flex-col items-center gap-6 opacity-10 mt-auto">
                <div className="w-16 h-16 border-4 border-[#643012] rounded-full flex items-center justify-center">
                   <i className="fas fa-file-shield text-2xl text-[#643012]"></i>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">PROTÉGER PAR PERASAFE</p>
                <p className="text-[8px] font-mono tracking-widest">COPIE UNIQUE - RÉFÉRENCE: {doc.id.toUpperCase()}</p>
             </div>
          </div>
        </div>
      </main>
      <style>{`
        .rich-text-viewer img { max-width: 100%; height: auto; margin: 3rem 0; display: block; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .rich-text-viewer font[size="7"] { font-size: 32px; line-height: 1.1; font-weight: 900; color: #1e293b; margin-bottom: 2rem; display: block; }
        @media (min-width: 768px) { .rich-text-viewer font[size="7"] { font-size: 64px; } }
      `}</style>
    </div>
  );
};

export default SecureViewer;
