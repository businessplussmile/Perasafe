// Fix: Replaced broken import and removed accidental copy-paste of type definitions
import React, { useEffect, useState } from 'react';
import { AuthorizedMember } from '../types';

interface GreetingAnimationProps {
  member: AuthorizedMember;
  onComplete: () => void;
}

const GreetingAnimation: React.FC<GreetingAnimationProps> = ({ member, onComplete }) => {
  const [phase, setPhase] = useState(0);

  // Extraire les deux premiers mots (ex: Mr. Chris)
  const shortName = member.name.split(' ').slice(0, 2).join(' ');

  useEffect(() => {
    // Séquence d'animation
    const timers = [
      setTimeout(() => setPhase(1), 200),   // Apparition du titre
      setTimeout(() => setPhase(2), 1200),  // Apparition du message
      setTimeout(() => setPhase(3), 3200),  // Début du fondu de sortie
      setTimeout(() => onComplete(), 3600)  // Fin de l'animation
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[300] bg-white flex flex-col items-center justify-center transition-opacity duration-1000 ${phase === 3 ? 'opacity-0' : 'opacity-100'}`}>
      {/* Effet de fond : Particules de luxe */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#F2AF31]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 text-center px-6 max-w-3xl">
        <div className={`mb-12 transition-all duration-1000 transform ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="w-20 h-20 bg-[#643012] text-[#F2AF31] rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl text-slate-900 italic tracking-tight">
            Honneur et Respect,
          </h1>
          <div className="mt-4 text-3xl md:text-5xl font-black text-[#643012] uppercase tracking-tighter">
            {shortName}
          </div>
        </div>

        <div className={`space-y-6 transition-all duration-1000 delay-500 transform ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="h-[1px] w-24 bg-[#F2AF31] mx-auto mb-8"></div>
          <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed italic">
            "Votre présence honore ce Conseil. Votre expertise et votre vision <br className="hidden md:block" /> 
            sont les piliers de nos décisions les plus stratégiques."
          </p>
          <div className="pt-10 flex items-center justify-center gap-4">
            <span className="text-[10px] font-black text-[#643012] uppercase tracking-[0.4em] opacity-40">Session Sécurisée Node X-14</span>
          </div>
        </div>
      </div>

      {/* Barre de progression discrète en bas */}
      <div className="absolute bottom-0 left-0 h-1 bg-[#F2AF31]/20 w-full overflow-hidden">
        <div className={`h-full bg-[#643012] transition-all duration-[3200ms] ease-linear origin-left scale-x-${phase > 0 ? '100' : '0'}`} style={{ transform: `scaleX(${phase > 0 ? 1 : 0})` }}></div>
      </div>
    </div>
  );
};

export default GreetingAnimation;