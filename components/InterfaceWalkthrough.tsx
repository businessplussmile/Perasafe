
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Plus, 
  Users, 
  Sparkles, 
  Search, 
  Eye, 
  Lock, 
  ChevronRight,
  MousePointer2,
  Image as ImageIcon,
  Clock,
  Volume2,
  VolumeX,
  Check,
  Loader2
} from 'lucide-react';

interface Scene {
  id: number;
  label: string;
  title: string;
  description: string;
  narration: string;
  highlightZone: { top: string; left: string; width: string; height: string };
  actionTitle: string;
  actionIcon: React.ReactNode;
}

const scenes: Scene[] = [
  {
    id: 1,
    label: "01. Initialisation",
    title: "Le Dashboard Stratégique",
    description: "Une vue épurée de vos actifs informationnels. Chaque document est une entité chiffrée indépendante.",
    narration: "Bienvenue sur votre tableau de bord stratégique. C'est ici que commence la sécurisation de vos actifs informationnels.",
    highlightZone: { top: "5%", left: "5%", width: "90%", height: "90%" },
    actionTitle: "Inventaire Sécurisé",
    actionIcon: <Search className="w-4 h-4" />
  },
  {
    id: 2,
    label: "02. Rédaction",
    title: "Éditeur & Media Chiffré",
    description: "Saisissez vos notes. Les images sont compressées à 165 Ko et préparées pour le chiffrement local.",
    narration: "Commencez par utiliser notre éditeur. Les images y sont compressées automatiquement avant d'être soumises au chiffrement local.",
    highlightZone: { top: "10%", left: "5%", width: "60%", height: "40%" },
    actionTitle: "Compression Native",
    actionIcon: <ImageIcon className="w-4 h-4" />
  },
  {
    id: 3,
    label: "03. Le Secret",
    title: "Définition du Code Pivot",
    description: "Le Code Pivot est votre clé AES-XOR. Il ne remonte jamais sur nos serveurs.",
    narration: "Ensuite, définissez votre Code Pivot, qui servira de clé AES-XOR locale. Il s'agit de votre unique pass d'accès, qui ne remonte jamais sur nos serveurs.",
    highlightZone: { top: "70%", left: "68%", width: "27%", height: "20%" },
    actionTitle: "Clé Souveraine",
    actionIcon: <Lock className="w-4 h-4" />
  },
  {
    id: 4,
    label: "04. Autorisation",
    title: "Filtrage des Partenaires",
    description: "Identifiez vos partenaires par email. Seuls ces comptes pourront tenter le déchiffrement.",
    narration: "Autorisez ensuite vos partenaires par email pour définir précisément qui est habilité à accéder à vos documents.",
    highlightZone: { top: "15%", left: "68%", width: "27%", height: "45%" },
    actionTitle: "Garde-Barrière",
    actionIcon: <Users className="w-4 h-4" />
  },
  {
    id: 5,
    label: "05. Expédition",
    title: "Signature & Verrouillage",
    description: "Le document est transformé en un bloc de données aléatoires.",
    narration: "Cliquez alors pour verrouiller votre document. Il est immédiatement transformé en un bloc chiffré, devenu totalement indéchiffrable.",
    highlightZone: { top: "65%", left: "5%", width: "60%", height: "25%" },
    actionTitle: "Validation XOR",
    actionIcon: <ShieldCheck className="w-4 h-4" />
  },
  {
    id: 6,
    label: "06. Réception",
    title: "L'Accès Partenaire",
    description: "Le système vérifie son email avant d'autoriser la saisie du code.",
    narration: "Une fois reçu, le partenaire est validé par son email. Cette vérification est indispensable pour initier la saisie de son code d'accès.",
    highlightZone: { top: "70%", left: "68%", width: "27%", height: "20%" },
    actionTitle: "Double Vérification",
    actionIcon: <Eye className="w-4 h-4" />
  },
  {
    id: 7,
    label: "07. Révélation",
    title: "Déchiffrement Réussi",
    description: "Le partenaire saisit le Code Pivot. Les données redeviennent lisibles.",
    narration: "Enfin, le partenaire saisit son Code Pivot. Le document est immédiatement déchiffré, permettant un accès fluide au contenu original.",
    highlightZone: { top: "15%", left: "5%", width: "50%", height: "30%" },
    actionTitle: "Restauration Flux",
    actionIcon: <Sparkles className="w-4 h-4" />
  }
];

const CodeDigit = ({ delay }: { delay: number }) => {
  return (
    <motion.span 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="font-mono text-sm text-indigo-700"
    >
      ●
    </motion.span>
  );
};

const DecryptText = () => {
  const [text, setText] = useState("............");
  useEffect(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let iterations = 0;
    const interval = setInterval(() => {
      setText(prev => prev.split('').map((_, i) => i < iterations ? "." : chars[Math.floor(Math.random() * chars.length)]).join(''));
      iterations += 1;
      if (iterations > 12) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, []);
  return <>{text}</>;
};

const TypingDocument = ({ content }: { content: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  useEffect(() => {
    let i = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      setDisplayedText(content.substring(0, i));
      i++;
      if (i > content.length) clearInterval(interval);
    }, 15);
    return () => clearInterval(interval);
  }, [content]);
  
  return <span className="whitespace-pre-wrap">{displayedText}</span>;
};

const InterfaceWalkthrough: React.FC = () => {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const synthesisRef = React.useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.15;
      if (isPlaying && isVoiceEnabled) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, isVoiceEnabled]);

  const speak = (text: string) => {
    if (!isVoiceEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    // Use the native voice directly without loading from URI
    utterance.rate = 1.1;
    utterance.pitch = 1;
    synthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
  };

  const handleTogglePlay = () => {
     setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (!isPlaying) {
      window.speechSynthesis.cancel();
      return;
    }
    
    // Speak narration on scene change
    if (isVoiceEnabled) {
      speak(scenes[currentScene].narration);
    } else {
      window.speechSynthesis.cancel();
    }

    const timer = setInterval(() => {
      setCurrentScene(prev => (prev + 1) % scenes.length);
    }, 8000); // Slightly longer for narration
    return () => clearInterval(timer);
  }, [isPlaying, currentScene, isVoiceEnabled]);

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          
          {/* Text Content */}
          <div className="w-full lg:w-1/3 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
              <Clock className="w-3 h-3" /> Walkthrough Interactif
            </div>
            
            <div className="relative min-h-[200px]">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentScene}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="space-y-4 absolute top-0 left-0 w-full"
                >
                  <p className="text-indigo-600 font-bold text-xs uppercase tracking-widest">{scenes[currentScene].label}</p>
                  <h2 className="text-4xl font-black tracking-tighter text-slate-900 leading-none">{scenes[currentScene].title}</h2>
                  <p className="text-slate-500 font-medium leading-relaxed">{scenes[currentScene].description}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex flex-wrap gap-2 pt-4">
              {scenes.map((scene, idx) => (
                <button
                  key={scene.id}
                  onClick={() => {
                    setCurrentScene(idx);
                    setIsPlaying(false);
                  }}
                  className={`w-10 h-1.5 rounded-full transition-all duration-500 ${idx === currentScene ? 'bg-indigo-600 w-16' : 'bg-slate-100 hover:bg-slate-200'}`}
                />
              ))}
            </div>

            <div className="pt-8 border-t border-slate-100">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-lg">
                    {scenes[currentScene].actionIcon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{scenes[currentScene].actionTitle}</span>
               </div>
            </div>
          </div>

          {/* Interface Simulation (The "Video") */}
          <div className="w-full lg:w-2/3">
             <audio ref={audioRef} src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" loop />
             <div className="relative aspect-video bg-slate-100 rounded-[3rem] p-4 md:p-8 shadow-2xl border-4 border-slate-50 overflow-hidden">
                
                <div className="w-full h-full relative">
                  {/* Mock Interface Content */}
                  <div className="w-full h-full bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                    
                    {/* UI Header */}
                    <div className="h-12 border-b border-slate-100 flex items-center px-6 justify-between bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        <div className="h-2 w-20 bg-slate-200 rounded-full"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-8 h-4 bg-indigo-100 rounded-full"></div>
                        <div className="w-4 h-4 bg-slate-200 rounded-full"></div>
                      </div>
                    </div>

                    {/* UI Content */}
                    <div className="flex-1 p-6 grid grid-cols-12 gap-6 relative">
                      
                      {/* Left Side: Creation / Editor Area */}
                      <motion.div 
                        className="col-span-8 space-y-4 origin-top-left relative"
                        animate={{ 
                          scale: currentScene === 1 ? 1.04 : 1,
                          zIndex: currentScene === 1 ? 10 : 1
                        }}
                        transition={{ 
                          duration: 0.8, 
                          ease: [0.16, 1, 0.3, 1] // Apple-like smooth spring/ease curve
                        }}
                      >
                        <div className="h-10 w-1/2 bg-slate-50 rounded-xl border border-slate-100 flex items-center px-4">
                          <div className="h-3 w-32 bg-slate-200 rounded-full"></div>
                        </div>
                        <div className="h-40 w-full bg-slate-50 rounded-2xl border border-slate-100 p-6 space-y-3 relative overflow-hidden">
                          {/* Decryption Effect */}
                          {currentScene >= 5 && currentScene < 7 && (
                            <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] flex items-center justify-center z-10 transition-all duration-500">
                              <Lock className="w-8 h-8 text-slate-400 opacity-20" />
                            </div>
                          )}
                          
                          {/* Content Area */}
                          <motion.div 
                            key={currentScene === 6 ? "decrypted" : "encrypted"}
                            initial={{ opacity: 0.2, filter: "blur(4px)" }}
                            animate={{ opacity: 1, filter: currentScene === 6 ? "blur(0px)" : "blur(4px)" }}
                            transition={{ duration: 0.6 }}
                            className={`space-y-2 ${currentScene === 6 ? 'h-full overflow-y-auto' : ''}`}
                          >
                            {currentScene === 6 ? (
                              <div className="text-[9px] sm:text-[10px] text-slate-800 font-serif leading-relaxed">
                                <TypingDocument content={`MEMORANDUM CONFIDENTIEL\n\nDate: 24 Octobre 2026\nSujet: Rapport de Stratégie Q3\n\nLes performances du dernier trimestre ont dépassé les attentes initiales. La stratégie de sécurisation des données avec un chiffrement local (AES-XOR) a permis une réduction des risques de 40% par rapport à l'année précédente.\n\nCe document est strictement confidentiel et ne doit pas être divulgué en dehors du cercle des partenaires autorisés de PeraSafe.`} />
                              </div>
                            ) : (
                              <>
                                <div className="h-2 w-full rounded-full bg-indigo-900"></div>
                                <div className="h-2 w-5/6 rounded-full bg-indigo-900"></div>
                                <div className="h-2 w-2/3 rounded-full bg-indigo-900"></div>
                                <div className="h-2 w-4/5 rounded-full bg-indigo-900 mt-3"></div>
                                <div className="h-2 w-1/2 rounded-full bg-indigo-900"></div>
                                <p className="text-[10px] font-mono text-indigo-800 pt-2 h-4 overflow-hidden">
                                  <motion.span
                                    key={currentScene >= 4 ? "encrypting" : "plain"}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    {currentScene >= 4 ? <DecryptText /> : "WAITING_FOR_DATA..."}
                                  </motion.span>
                                </p>
                              </>
                            )}
                          </motion.div>
                        </div>
                        <div className={`flex justify-between items-center p-4 rounded-2xl shadow-lg transition-all duration-700 ${currentScene === 4 ? 'bg-green-600 scale-105' : 'bg-indigo-600 shadow-indigo-600/10'}`}>
                          <div className="flex items-center gap-2 text-white">
                            {currentScene === 4 ? <ShieldCheck className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                            <div className="h-2 w-24 bg-white/30 rounded-full"></div>
                          </div>
                          <div className="h-6 w-20 bg-white/20 rounded-lg"></div>
                        </div>
                      </motion.div>

                      {/* Right Side: Partners / Settings Area */}
                      <div className="col-span-4 space-y-4">
                        <div className={`p-4 rounded-2xl border transition-all duration-700 ${currentScene === 3 || currentScene === 5 ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/20 scale-[1.02]' : 'bg-slate-50 border-slate-100'}`}>
                           <div className="flex items-center gap-2 text-[8px] font-black uppercase text-indigo-600">
                             <Users className="w-3 h-3" /> Inviter Partenaires
                           </div>
                           <div className="h-8 w-full bg-white rounded-lg border border-slate-200 flex items-center px-3 relative mt-2">
                             <div className="h-1.5 w-4/5 bg-slate-200 rounded-full"></div>
                             {currentScene >= 3 && (
                               <motion.div 
                                 initial={{ opacity: 0, scale: 0 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 className="absolute right-1 w-6 h-6 bg-green-500 rounded flex items-center justify-center text-white text-[10px]"
                               >
                                 +
                               </motion.div>
                             )}
                           </div>
                           <div className="space-y-2 mt-2">
                              <div className={`flex items-center gap-2 p-2 bg-white rounded-lg border text-[7px] font-bold overflow-hidden ${currentScene >= 5 ? 'border-green-200 text-green-700' : 'border-slate-100 text-slate-400'}`}>
                                <div className="flex-1 overflow-hidden truncate">
                                  {currentScene >= 3 ? 'investisseur@vision.com' : 'Saisir email...'}
                                </div>
                                {currentScene === 5 && (
                                  <motion.div 
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: "auto", opacity: 1 }}
                                    className="flex items-center gap-1 bg-green-100/50 text-green-700 px-1.5 py-0.5 rounded-full overflow-hidden whitespace-nowrap"
                                  >
                                    <motion.div
                                       animate={{ rotate: 360 }}
                                       transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                    >
                                      <Loader2 className="w-2 h-2" />
                                    </motion.div>
                                    Vérification...
                                  </motion.div>
                                )}
                                {currentScene > 5 && (
                                  <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className="flex items-center gap-1 bg-green-500 text-white px-1.5 py-0.5 rounded-full whitespace-nowrap"
                                  >
                                    <Check className="w-2 h-2" /> Validé
                                  </motion.div>
                                )}
                              </div>
                           </div>
                        </div>

                        <div className={`p-4 rounded-2xl border transition-all duration-1000 ${currentScene === 2 ? 'bg-indigo-50 border-indigo-200 scale-105' : 'bg-slate-50 border-slate-100'}`}>
                           <div className="flex items-center gap-2 text-[8px] font-black uppercase text-indigo-700">
                             <Lock className="w-3 h-3" /> Code Pivot
                           </div>
                           <div className="h-8 w-full bg-white rounded-lg border border-indigo-100 flex items-center px-3 gap-1 mt-2 overflow-hidden">
                             {currentScene >= 2 && (
                               <motion.div className="flex gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                 {currentScene === 6 ? (
                                    [...Array(4)].map((_, i) => (
                                      <CodeDigit key={i} delay={i * 0.15} />
                                    ))
                                 ) : (
                                    <>
                                      <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-sm"></div>
                                      <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-sm"></div>
                                      <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-sm"></div>
                                      <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-sm"></div>
                                    </>
                                 )}
                               </motion.div>
                             )}
                           </div>
                        </div>
                      </div>

                      <motion.div 
                        initial={false}
                        animate={{ 
                          x: currentScene === 0 ? 0 : 
                             currentScene === 1 ? 250 :
                             currentScene === 2 ? 650 :
                             currentScene === 3 ? 650 :
                             currentScene === 4 ? 200 :
                             currentScene === 5 ? 400 : 350, 
                          y: currentScene === 0 ? 0 :
                             currentScene === 1 ? -100 :
                             currentScene === 2 ? 220 :
                             currentScene === 3 ? 60 :
                             currentScene === 4 ? 180 :
                             currentScene === 5 ? -20 : -100,
                          scale: [1, 1.2, 1]
                        }}
                        transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
                        className="absolute top-1/2 left-1/4 z-50 pointer-events-none drop-shadow-2xl"
                      >
                         <div className="relative">
                            <MousePointer2 className="w-8 h-8 text-indigo-600 fill-white stroke-[2px]" />
                            <motion.div 
                              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="absolute top-0 left-0 w-8 h-8 bg-indigo-600/30 rounded-full -z-10"
                            />
                         </div>
                      </motion.div>
                    </div>

                    {/* Bottom Status */}
                    <div className="h-8 bg-slate-900 px-6 flex items-center justify-between text-[6px] text-white/50 font-mono tracking-widest">
                       <div>AES-256-XOR-READY</div>
                       <div className="flex gap-4">
                         <span>CPU: 4%</span>
                         <span className="text-green-500">ENCRYPT_ACTIVE</span>
                       </div>
                    </div>
                  </div>
                  
                </div>

                {/* Overlays / Tooltips */}
                <AnimatePresence>
                  {currentScene === 1 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute bottom-12 right-12 bg-white rounded-2xl shadow-2xl p-4 border border-slate-100 z-[100] max-w-[200px]"
                    >
                      <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Stockage Intelligent</p>
                      <p className="text-[8px] text-slate-500 font-medium">Contrôlez votre espace disque en temps réel.</p>
                    </motion.div>
                  )}
                </AnimatePresence>


                {/* Play/Pause Control Overlay */}
                
             </div>

             <div className="mt-8 flex justify-between items-center px-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Simulation de l'interface V2.4</p>
                <div className="flex gap-4">
                   <button 
                     onClick={toggleVoice} 
                     className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isVoiceEnabled ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                   >
                     {isVoiceEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                     {isVoiceEnabled ? "Audio Activé" : "Audio Désactivé"}
                   </button>
                   <div className="h-4 w-[1px] bg-slate-200 my-auto"></div>
                   <button onClick={handleTogglePlay} className="text-slate-400 hover:text-indigo-600 transition-colors">
                      <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-xs`}></i>
                   </button>
                   <div className="h-3 w-[1px] bg-slate-200"></div>
                   <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Recorder</span>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default InterfaceWalkthrough;
