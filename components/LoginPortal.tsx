
import React, { useState } from 'react';
import { signInWithGoogle } from '../services/firebaseService';

const LoginPortal: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleGoogleLogin = async () => {
    setStatus('scanning');
    setErrorMessage('');
    try {
      await signInWithGoogle();
    } catch (error) {
      setStatus('error');
      setErrorMessage("Échec de la connexion Google.");
    } finally {
      setStatus('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#f4f7f9] flex items-center justify-center p-4">
      <div className="relative w-full max-w-[370px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in flex flex-col border border-white/50">
        <div className="h-[8px] w-full bg-[#643012]"></div>
        <div className="px-8 pt-8 pb-10 relative z-10 flex flex-col items-center">
          <div className="mb-6">
            <div className="w-[68px] h-[68px] bg-[#fdf8f4] rounded-[1.5rem] flex items-center justify-center text-[#643012] relative shadow-sm border border-[#f5ece6]">
              <i className={`fas ${status === 'scanning' ? 'fa-fingerprint animate-pulse' : 'fa-user-shield'} text-xl`}></i>
              {status === 'scanning' && (
                <div className="absolute inset-0 overflow-hidden rounded-[1.5rem]">
                  <div className="w-full h-[2px] bg-[#F2AF31] shadow-[0_0_8px_#F2AF31] animate-[scan_1.5s_infinite_linear]"></div>
                </div>
              )}
            </div>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-[22px] font-black text-[#1e293b] uppercase tracking-tighter mb-2">Accès Cloud Secure</h1>
            <div className="inline-block bg-[#F2AF31] px-5 py-1.5 rounded-full shadow-sm">
              <span className="text-[8px] font-black text-[#643012] uppercase tracking-[0.2em]">PeraSafe Cloud Node</span>
            </div>
          </div>
          
          <div className="w-full space-y-5">
            <p className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
              Connectez-vous pour accéder à votre coffre-fort entreprise ou consulter les documents partagés par vos partenaires.
            </p>
            {status === 'error' && <div className="text-red-600 text-[8px] font-black uppercase text-center tracking-widest animate-shake">{errorMessage}</div>}
            <div className="pt-3">
              <button 
                onClick={handleGoogleLogin}
                disabled={status === 'scanning'}
                className={`w-full py-5 rounded-[1.4rem] font-black uppercase text-[10px] tracking-[0.2em] transition-all btn-active flex items-center justify-center gap-3 ${status === 'scanning' ? 'bg-slate-100 text-[#94a3b8]' : 'bg-[#643012] text-white shadow-lg'}`}
              >
                {status === 'scanning' ? (
                  "Identification..."
                ) : (
                  <>
                    <i className="fab fa-google text-lg"></i>
                    Continuer avec Google
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="mt-8 text-center"><p className="text-[8px] font-extrabold text-[#cbd5e1] uppercase tracking-[0.2em]">Sécurité Cloud PeraSafe X-14</p></div>
        </div>
      </div>
      <style>{`
        @keyframes scan { 0% { transform: translateY(-5px); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateY(65px); opacity: 0; } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
};

export default LoginPortal;
