import React, { useEffect, useState } from 'react';
import { db } from '../services/firebaseService';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft } from 'lucide-react';

interface SubscriptionSuccessAnimationProps {
  companyName: string;
  onComplete: () => void;
}

const SubscriptionSuccessAnimation: React.FC<SubscriptionSuccessAnimationProps> = ({ companyName, onComplete }) => {
  const { profile } = useAuth();
  const [phase, setPhase] = useState(0);
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyStep, setSurveyStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [surveyData, setSurveyData] = useState({
    motivation: '',
    discovery: ''
  });

  useEffect(() => {
    // Séquence d'animation
    const timers = [
      setTimeout(() => setPhase(1), 200),   // Apparition du titre
      setTimeout(() => setPhase(2), 1500),  // Apparition du message rassurant
      setTimeout(() => setPhase(3), 3500)   // Apparition du bouton "Merci"
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  const handleMerciClick = () => {
    setShowSurvey(true);
  };

  const handleSurveySubmit = async () => {
    if (!profile) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        onboardingSurvey: surveyData
      });
      // Fin et sortie
      setPhase(4); // Trigger fade out
      setTimeout(onComplete, 1000);
    } catch (e) {
      console.error(e);
      // fallback
      setTimeout(onComplete, 500);
    }
  };

  const handleSkip = () => {
    setPhase(4);
    setTimeout(onComplete, 1000);
  };

  const motivationOptions = [
    'Mettre fin aux fuites de documents confidentiels',
    'Contrôler l\'accès des prestataires externes',
    'Sécuriser les communications de la direction',
    'Répondre aux exigences de conformité',
    'Autre objectif de sécurité'
  ];

  const discoveryOptions = [
    'Recommandation d\'un partenaire / confrère',
    'Recherche ciblée sur le web',
    'Article de presse spécialisée',
    'Réseaux professionnels (LinkedIn)',
    'J\'ai reçu un document sécurisé PERASafe',
    'Autre source'
  ];

  return (
    <div className={`fixed inset-0 z-[300] bg-[#f8fafc] flex flex-col items-center justify-center transition-opacity duration-1000 ${phase === 4 ? 'opacity-0' : 'opacity-100'}`}>
      {/* Effet de fond : Particules technologiques / Cloud */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {!showSurvey ? (
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto flex flex-col items-center">
          <div className={`transition-all duration-1000 transform ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter">
              Bienvenue, {companyName}
            </h1>
            <div className="mt-4 text-xl font-bold text-slate-400 uppercase tracking-widest">
              Votre espace PERASafe est initialisé
            </div>
          </div>

          <div className={`mt-10 space-y-6 transition-all duration-1000 transform ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="h-[2px] w-24 bg-indigo-600 mx-auto mb-8"></div>
            <p className="text-slate-600 text-lg md:text-2xl font-medium leading-relaxed max-w-2xl mx-auto">
              La protection de vos données stratégiques est notre <span className="font-bold text-indigo-600">absolue priorité</span>. 
              Vous bénéficiez désormais d'une infrastructure cloud blindée, chiffrée de bout en bout et conçue pour la confidentialité totale.
            </p>
            <div className="pt-6 flex flex-col items-center justify-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sécurité de Grade Militaire Active</span>
              </div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] opacity-40">Chiffrement AES-256</span>
            </div>
          </div>

          <div className={`mt-16 transition-all duration-700 transform ${phase >= 3 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
            <button 
              onClick={handleMerciClick}
              className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-indigo-600 hover:shadow-indigo-600/30 transition-all hover:-translate-y-1"
            >
              Merci
            </button>
          </div>
        </div>
      ) : (
        <div className="relative z-10 w-full max-w-xl mx-auto px-6 animate-fade-in-up">
          <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-slate-100">
            {surveyStep === 1 && (
              <div className="animate-fade-in">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Mieux vous accompagner</h2>
                <p className="text-sm font-bold text-slate-500 mb-8">En comprenant vos enjeux, nous adapterons votre expérience de sécurité.</p>
                
                <div className="space-y-4 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">1/2 • Quel défi de sécurité souhaitez-vous résoudre en priorité ?</label>
                  <div className="grid gap-3">
                    {motivationOptions.map((option) => (
                      <label key={option} className={`relative flex items-center p-4 cursor-pointer rounded-2xl border-2 transition-all ${surveyData.motivation === option ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
                        <input 
                          type="radio" 
                          name="motivation" 
                          value={option} 
                          checked={surveyData.motivation === option}
                          onChange={(e) => {
                            setSurveyData({ ...surveyData, motivation: e.target.value });
                            setTimeout(() => setSurveyStep(2), 300);
                          }}
                          className="sr-only"
                        />
                        <span className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-all ${surveyData.motivation === option ? 'border-indigo-600' : 'border-slate-300'}`}>
                          {surveyData.motivation === option && <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-fade-in"></span>}
                        </span>
                        <span className={`text-sm font-bold ${surveyData.motivation === option ? 'text-indigo-900' : 'text-slate-600'}`}>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="mt-8 flex justify-end">
                  <button onClick={handleSkip} className="text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">
                    Plus tard
                  </button>
                </div>
              </div>
            )}

            {surveyStep === 2 && (
              <div className="animate-fade-in">
                <button onClick={() => setSurveyStep(1)} className="mb-6 flex flex-row gap-2 items-center text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">
                  <ArrowLeft className="w-4 h-4" /> Retour
                </button>
                <div className="space-y-4 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">2/2 • Comment avez-vous été introduit(e) à PERASafe ?</label>
                  <div className="grid gap-3">
                    {discoveryOptions.map((option) => (
                      <label key={option} className={`relative flex items-center p-4 cursor-pointer rounded-2xl border-2 transition-all ${surveyData.discovery === option ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
                        <input 
                          type="radio" 
                          name="discovery" 
                          value={option} 
                          checked={surveyData.discovery === option}
                          onChange={(e) => {
                            setSurveyData({ ...surveyData, discovery: e.target.value });
                            setTimeout(() => setSurveyStep(3), 300);
                          }}
                          className="sr-only"
                        />
                        <span className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-all ${surveyData.discovery === option ? 'border-indigo-600' : 'border-slate-300'}`}>
                          {surveyData.discovery === option && <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-fade-in"></span>}
                        </span>
                        <span className={`text-sm font-bold ${surveyData.discovery === option ? 'text-indigo-900' : 'text-slate-600'}`}>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {surveyStep === 3 && (
              <div className="animate-fade-in text-center py-6">
                <button onClick={() => setSurveyStep(2)} className="mb-8 flex flex-row gap-2 items-center text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">
                  <ArrowLeft className="w-4 h-4" /> Modifier mes réponses
                </button>
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">Configuration terminée</h2>
                <p className="text-sm font-bold text-slate-500 mb-10">Votre profil d'entreprise sécurisé est maintenant prêt à l'emploi.</p>
                
                <button 
                  onClick={handleSurveySubmit}
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSubmitting ? 'Traitement...' : 'Accéder à votre tableau de bord'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionSuccessAnimation;
