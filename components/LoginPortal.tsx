
import React, { useState } from 'react';
import { signInWithGoogle } from '../services/firebaseService';
import { ShieldCheck, ChevronLeft, Fingerprint, Lock, ArrowRight } from 'lucide-react';

interface LoginPortalProps {
  onBack?: () => void;
}

const LoginPortal: React.FC<LoginPortalProps> = ({ onBack }) => {
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
    <div className="fixed inset-0 z-[200] bg-slate-50 flex items-center justify-center p-4 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      
      <div className="relative w-full max-w-[380px] bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden animate-fade-in flex flex-col border border-slate-100">
        <div className="h-[8px] w-full bg-indigo-600"></div>
        
        <div className="px-8 pt-6 relative z-10 flex justify-between items-center">
          {onBack && (
            <button 
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
          )}
          <div className="bg-indigo-50 px-3 py-1 rounded-full">
            <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">v4.2.0 Stable</span>
          </div>
        </div>

        <div className="px-8 pt-4 pb-12 relative z-10 flex flex-col items-center">
          <div className="mb-8">
            <div className="w-[80px] h-[80px] bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 relative shadow-inner border border-indigo-100/50">
              <Fingerprint className={`w-10 h-10 ${status === 'scanning' ? 'animate-pulse' : ''}`} />
              {status === 'scanning' && (
                <div className="absolute inset-x-4 inset-y-4 overflow-hidden rounded-[1rem]">
                  <div className="absolute left-0 w-full h-[2px] bg-indigo-500 shadow-[0_0_15px_#6366f1] animate-[scan_2s_infinite_linear]"></div>
                </div>
              )}
            </div>
          </div>

          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">PeraSafe</h1>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Node Intelligence</p>
          </div>
          
          <div className="w-full space-y-6">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <p className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                Accès limité au personnel autorisé. Authentification via Google Cloud Identity requise.
              </p>
            </div>

            {status === 'error' && (
              <div className="bg-red-50 py-2 rounded-lg text-red-600 text-[8px] font-black uppercase text-center tracking-widest animate-shake">
                {errorMessage}
              </div>
            )}

            <button 
              onClick={handleGoogleLogin}
              disabled={status === 'scanning'}
              className="w-full bg-slate-900 text-white rounded-[1.5rem] py-5 flex items-center justify-between px-8 group hover:bg-indigo-600 hover:shadow-2xl hover:shadow-indigo-600/20 transition-all duration-500 disabled:opacity-50"
            >
              <span className="flex items-center gap-3">
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4 grayscale group-hover:grayscale-0 transition-all" alt="G" />
                <span className="text-[11px] font-black uppercase tracking-widest mt-0.5">Identification Cloud</span>
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
          
          <div className="mt-10 flex items-center gap-2 opacity-30">
            <Lock className="w-3 h-3" />
            <span className="text-[8px] font-bold uppercase tracking-widest">End-to-End Encrypted</span>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes scan { 0% { top: -5%; opacity: 0; } 20% { opacity: 1; } 100% { top: 105%; opacity: 0; } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
};

export default LoginPortal;
