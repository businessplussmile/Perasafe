
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Lock, 
  Users, 
  Zap, 
  Trash2, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Key,
  Eye,
  CheckCircle2,
  Volume2,
  VolumeX
} from 'lucide-react';

const LogoIcon = () => (
  <div className="w-8 h-8 bg-[#643012] rounded-lg flex items-center justify-center">
    <ShieldCheck className="text-[#F2AF31] w-5 h-5" />
  </div>
);

const ArrowIcon = () => <ChevronRight className="w-5 h-5" />;

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  visual: React.ReactNode;
}

const slides: Slide[] = [
  {
    id: 1,
    title: "Bienvenue dans l'Excellence Sécuritaire",
    subtitle: "PeraSafe : Plus qu'un coffre-fort, un sanctuaire.",
    description: "Découvrez comment nous protégeons vos idées les plus sensibles avec un protocole de chiffrement local de grade militaire.",
    icon: <ShieldCheck className="w-8 h-8" />,
    color: "bg-indigo-600",
    visual: (
      <div className="relative w-full h-full flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="w-48 h-48 bg-indigo-500 rounded-[3rem] shadow-2xl flex items-center justify-center relative z-10"
        >
          <ShieldCheck className="w-24 h-24 text-white" />
        </motion.div>
        <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full animate-pulse"></div>
      </div>
    )
  },
  {
    id: 2,
    title: "Chiffrement Local XOR",
    subtitle: "Vos données ne sortent jamais en clair.",
    description: "Chaque caractère que vous tapez est instantanément transformé en suite binaire indéchiffrable directement dans votre navigateur.",
    icon: <Lock className="w-8 h-8" />,
    color: "bg-slate-900",
    visual: (
      <div className="w-full max-w-md bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-700 font-mono text-[10px]">
        <div className="flex gap-1.5 mb-4">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
        </div>
        <div className="space-y-2">
          <p className="text-indigo-400">INPUT: "Secret d'acquisition..."</p>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-slate-400"
          >
            ENCRYPTING [XOR_ALGO_V14]...
          </motion.p>
          <div className="grid grid-cols-8 gap-1">
            {Array.from({ length: 32 }).map((_, i) => (
              <motion.div 
                key={i}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 2, delay: i * 0.05, repeat: Infinity }}
                className="h-4 bg-indigo-500/30 rounded flex items-center justify-center text-indigo-300"
              >
                {Math.round(Math.random())}
              </motion.div>
            ))}
          </div>
          <p className="text-green-400 font-black">STATUS: PROTECTED</p>
        </div>
      </div>
    )
  },
  {
    id: 3,
    title: "Le Code Pivot",
    subtitle: "La seule clé, et elle est à vous.",
    description: "Sans votre code pivot unique, même nos serveurs ne peuvent pas lire vos documents. C'est la souveraineté numérique totale.",
    icon: <Key className="w-8 h-8" />,
    color: "bg-[#643012]",
    visual: (
      <div className="relative">
        <motion.div 
          animate={{ rotateY: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-40 h-56 bg-[#F2AF31] rounded-2xl shadow-2xl flex flex-col items-center justify-between p-6 border-4 border-[#643012]/10"
        >
          <LogoIcon />
          <div className="w-full space-y-2">
            <div className="h-1 bg-[#643012]/20 rounded-full w-full"></div>
            <div className="h-1 bg-[#643012]/20 rounded-full w-3/4"></div>
            <div className="h-1 bg-[#643012]/20 rounded-full w-1/2"></div>
          </div>
          <div className="bg-[#643012] text-[#F2AF31] px-3 py-1 rounded-lg text-[9px] font-black tracking-widest">
            SAFE-7412
          </div>
        </motion.div>
      </div>
    )
  },
  {
    id: 4,
    title: "Partage Sélectif",
    subtitle: "L'invitation est obligatoire.",
    description: "Même avec le code, une personne non autorisée par email sera systématiquement bloquée par nos gardes-barrière.",
    icon: <Users className="w-8 h-8" />,
    color: "bg-orange-500",
    visual: (
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <div className="bg-white p-4 rounded-2xl shadow-lg border-2 border-green-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><CheckCircle2 /></div>
          <div>
            <p className="text-xs font-black text-slate-800">Partenaire Autorisé</p>
            <p className="text-[10px] text-slate-400">investor@global.com</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-lg border-2 border-red-100 flex items-center gap-4 opacity-50">
          <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center"><X /></div>
          <div>
            <p className="text-xs font-black text-slate-800">Accès Bloqué</p>
            <p className="text-[10px] text-slate-400">unknown@hacker.io</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 5,
    title: "Cycle d'Auto-Destruction",
    subtitle: "L'exposition est temporaire.",
    description: "Dès l'ouverture, le compte à rebours commence. Après 24h, le document se verrouille pour toujours.",
    icon: <Trash2 className="w-8 h-8" />,
    color: "bg-red-600",
    visual: (
      <div className="text-center space-y-6">
        <div className="relative">
          <svg className="w-48 h-48 -rotate-90">
             <circle cx="96" cy="96" r="88" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-slate-100" />
             <motion.circle 
               cx="96" cy="96" r="88" fill="transparent" stroke="currentColor" strokeWidth="12" strokeDasharray="553"
               initial={{ strokeDashoffset: 0 }}
               animate={{ strokeDashoffset: 553 }}
               transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
               className="text-red-500" 
             />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black text-slate-900 leading-none">23:59</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Séquence Finale</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 6,
    title: "Prêt à sécuriser vos idées ?",
    subtitle: "Plus de 2 000 cadres stratégiques nous font confiance.",
    description: "Rejoignez l'élite de la confidentialité numérique aujourd'hui.",
    icon: <Sparkles className="w-8 h-8" />,
    color: "bg-indigo-600",
    visual: (
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {}} 
        className="px-12 py-6 bg-indigo-600 text-white rounded-[2rem] text-xl font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/30 flex items-center gap-4"
      >
        Démarrer <ArrowIcon />
      </motion.button>
    )
  }
];

interface DemoPresentationProps {
  isOpen: boolean;
  onClose: () => void;
  onFinalStart: () => void;
}

const DemoPresentation: React.FC<DemoPresentationProps> = ({ isOpen, onClose, onFinalStart }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  // Force play on first interaction within the demo
  const handleUserInteraction = () => {
    if (!hasInteracted && audioRef.current) {
      audioRef.current.play().catch(e => console.log("Still blocked:", e));
      setHasInteracted(true);
    }
  };

  const next = () => {
    handleUserInteraction();
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      onFinalStart();
    }
  };

  const prev = () => {
    handleUserInteraction();
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  useEffect(() => {
    if (isOpen && audioRef.current) {
      audioRef.current.volume = 0.3;
      // Try to play immediately, but it might fail
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          console.log("Autoplay blocked - waiting for user interaction");
        });
      }
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentSlide]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-white flex flex-col md:flex-row overflow-hidden animate-fade-in">
      {/* Sidebar Progress */}
      <div className="hidden md:flex w-24 bg-slate-50 border-r border-slate-100 flex-col items-center py-12 gap-4">
        <LogoIcon />
        <div className="flex-1 flex flex-col justify-center gap-3">
          {slides.map((_, i) => (
            <div 
              key={i} 
              className={`w-1 rounded-full transition-all duration-500 ${i === currentSlide ? 'h-8 bg-indigo-600' : (i < currentSlide ? 'h-2 bg-indigo-200' : 'h-2 bg-slate-200')}`}
            />
          ))}
        </div>
        
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setIsMuted(!isMuted)} 
            className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors"
            title={isMuted ? "Activer le son" : "Couper le son"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors" title="Fermer la démo">
            <X size={20} />
          </button>
        </div>
      </div>

      <audio 
        ref={audioRef}
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        loop
        preload="auto"
        muted={isMuted}
      />

      {/* Main Content Area */}
      <div 
        onClick={handleUserInteraction}
        className="flex-1 relative flex flex-col overflow-hidden cursor-default"
      >
        {/* Mobile Header */}
        <div className="md:hidden p-6 flex justify-between items-center">
          <LogoIcon />
          <button onClick={onClose} className="text-slate-400"><X /></button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={currentSlide}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="flex-1 flex flex-col lg:flex-row items-center justify-center px-6 md:px-20 lg:px-32 gap-12 lg:gap-24"
          >
            {/* Visual Part */}
            <div className="w-full lg:w-1/2 flex items-center justify-center">
              {slides[currentSlide].visual}
            </div>

            {/* Text Part */}
            <div className="w-full lg:w-1/2 space-y-8 max-w-xl text-center lg:text-left">
              <div className={`w-16 h-16 ${slides[currentSlide].color} text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl mx-auto lg:mx-0 shadow-indigo-200`}>
                {slides[currentSlide].icon}
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em]">{slides[currentSlide].subtitle}</h4>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
                  {slides[currentSlide].title}
                </h2>
                <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed">
                  {slides[currentSlide].description}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="p-8 md:p-12 lg:px-32 flex flex-col md:flex-row items-center justify-between gap-8 mt-auto border-t border-slate-50 md:border-transparent">
           <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:flex">
              <span className="text-slate-800">Slide {currentSlide + 1}</span> 
              <span className="opacity-30">/</span>
              <span>{slides.length}</span>
           </div>

           <div className="flex items-center gap-4 w-full md:w-auto">
             <button 
               onClick={prev}
               disabled={currentSlide === 0}
               className={`flex-1 md:flex-none px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200 flex items-center justify-center gap-2 transition-all ${currentSlide === 0 ? 'opacity-30' : 'hover:bg-slate-50'}`}
             >
               <ChevronLeft className="w-4 h-4" /> Retour
             </button>
             <button 
               onClick={next}
               className="flex-1 md:w-48 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-slate-800 shadow-xl shadow-slate-900/10"
             >
               {currentSlide === slides.length - 1 ? 'C\'est parti !' : 'Suivant'} <ChevronRight className="w-4 h-4" />
             </button>
           </div>
        </div>
      </div>

      {/* Decorative Grid Progress Background */}
      <div className="absolute inset-0 -z-10 grid grid-cols-12 grid-rows-6 opacity-[0.03] pointer-events-none">
        {Array.from({ length: 72 }).map((_, i) => (
          <div key={i} className="border-[0.5px] border-slate-900"></div>
        ))}
      </div>
    </div>
  );
};

export default DemoPresentation;
