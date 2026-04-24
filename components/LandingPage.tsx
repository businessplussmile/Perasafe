
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Zap, Lock, Users, Sparkles, ChevronRight, Play, CheckCircle2, ArrowRight, User } from 'lucide-react';
import ParallaxSecuritySpace from './ParallaxSecuritySpace';
import DemoPresentation from './DemoPresentation';
import InterfaceWalkthrough from './InterfaceWalkthrough';
import { db } from '../services/firebaseService';
import { doc, onSnapshot } from 'firebase/firestore';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
  onViewProtocol: () => void;
  onViewPrivacy: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin, onViewProtocol, onViewPrivacy }) => {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [systemSettings, setSystemSettings] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);

    const unsubSettings = onSnapshot(doc(db, 'system', 'settings'), (snap) => {
       if (snap.exists()) {
          setSystemSettings(snap.data());
       }
    });

    return () => {
       window.removeEventListener('scroll', handleScroll);
       unsubSettings();
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
      <DemoPresentation 
        isOpen={isDemoOpen} 
        onClose={() => setIsDemoOpen(false)} 
        onFinalStart={() => {
          setIsDemoOpen(false);
          onStart();
        }}
      />
      {/* Dynamic Island Navigation */}
      <div className="fixed top-6 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none">
        <motion.nav 
          layout
          initial={{ y: -100, opacity: 0 }}
          animate={{ 
            y: 0, 
            opacity: 1,
            width: isScrolled ? 'auto' : '100%',
            maxWidth: isScrolled ? '580px' : '960px',
            scale: isScrolled ? 0.95 : 1,
          }}
          transition={{ 
            type: 'spring', 
            damping: 25, 
            stiffness: 150,
            layout: { duration: 0.5, ease: [0.23, 1, 0.32, 1] }
          }}
          style={{ willChange: "transform, width, max-width" }}
          className="pointer-events-auto relative bg-slate-900/90 backdrop-blur-3xl rounded-full border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center py-1.5 sm:py-2 transition-shadow duration-500 hover:shadow-[0_25px_60px_rgba(99,102,241,0.25)] ring-1 ring-white/5"
        >
          {/* Logo Section */}
          <motion.div 
            layout
            className="flex items-center gap-2 pl-3 md:pl-5 pr-2 md:pr-5 border-r border-white/10 h-8 md:h-10 shrink-0"
          >
            <motion.div 
              layout
              className="bg-indigo-600 p-1.5 rounded-xl shadow-lg shadow-indigo-600/20"
            >
              <ShieldCheck className="text-white w-4 h-4 md:w-5 md:h-5" />
            </motion.div>
            {!isScrolled && (
              <motion.span 
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="hidden sm:block text-white text-xs md:text-sm font-black tracking-tighter uppercase whitespace-nowrap"
              >
                PERASafe
              </motion.span>
            )}
          </motion.div>

          {/* Navigation Links */}
          {!isScrolled && (
            <motion.div 
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="hidden lg:flex items-center gap-6 px-6"
            >
              <a href="#features" className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Fonctions</a>
              <a href="#security" className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Sécurité</a>
              <a href="#pricing" className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Tarifs</a>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div layout className="flex items-center gap-1 md:gap-2 pr-1 ml-auto">
            <button 
              onClick={onLogin}
              className="px-3 md:px-6 py-2 md:py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-colors whitespace-nowrap"
            >
              Connexion
            </button>
            <button 
              onClick={onStart}
              className="bg-white text-slate-900 px-4 md:px-8 py-2 md:py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all whitespace-nowrap ring-1 ring-black/5"
            >
              C'est parti
            </button>
          </motion.div>
        </motion.nav>
      </div>

      {/* Hero Section */}
      <section className="pt-40 pb-20 md:pt-56 md:pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8">
              <Sparkles className="w-3 h-3" /> Intelligence Stratégique Sécurisée
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[0.9] tracking-tighter text-slate-900 mb-8">
              Protégez vos <br />
              <span className="text-indigo-600 relative">
                idées les plus
                <motion.svg 
                  className="absolute -bottom-4 left-0 w-full h-4 text-orange-400" 
                  viewBox="0 0 400 20"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  <path d="M5 15 Q 100 5, 200 15 T 395 15" fill="transparent" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </motion.svg>
              </span>
              <br /> confidentielles.
            </h1>
            
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 font-medium leading-relaxed mb-12">
              Le premier coffre-fort numérique conçu pour la rédaction stratégique et le partage ultra-sécurisé avec vos partenaires privilégiés.
            </p>

            <div className="flex flex-col items-center gap-6">
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 w-full">
                <button 
                  onClick={onStart}
                  className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:scale-105 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                >
                  COMMENCER GRATUITEMENT <ChevronRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={onLogin}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest bg-[#F2AF31] text-slate-900 hover:brightness-105 shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3"
                >
                  <div className="w-6 h-6 bg-black/10 rounded-full flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-slate-900" />
                  </div>
                  Accès Partenaire Invité
                </button>
                <button 
                  onClick={() => setIsDemoOpen(true)}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-3 group"
                >
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                  </div>
                  Voir Démo
                </button>
              </div>
            </div>
          </motion.div>

          {/* Abstract background shapes */}
          <div className="absolute top-0 -left-20 w-72 h-72 bg-indigo-200/30 blur-[100px] rounded-full -z-10 animate-pulse"></div>
          <div className="absolute top-40 -right-20 w-96 h-96 bg-orange-200/20 blur-[120px] rounded-full -z-10"></div>
        </div>
      </section>

      {/* Stats/Social Proof */}
      <section className="py-12 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-between items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
          <div className="flex items-center gap-2 font-black text-xl tracking-tighter">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-xs">V</div>
            VENTURE.CAP
          </div>
          <div className="flex items-center gap-2 font-black text-xl tracking-tighter">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-xs">L</div>
            LAW.TECH
          </div>
          <div className="flex items-center gap-2 font-black text-xl tracking-tighter">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-xs">S</div>
            STRAT.FORCE
          </div>
          <div className="flex items-center gap-2 font-black text-xl tracking-tighter">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-xs">T</div>
            TRUST.CO
          </div>
        </div>
      </section>

      {/* Bento Grid Features Section (Olacraft vibe) */}
      <section id="features" className="relative py-24 md:py-40 px-6 bg-[#fdfdfd] overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="mb-24 text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-[0.3em] mb-6 shadow-xl"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" /> Intelligence Souveraine
            </motion.div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 uppercase leading-[0.85]">Pureté. Puissance. <br />Souveraineté.</h2>
            <p className="text-slate-400 max-w-2xl mx-auto font-medium text-lg leading-relaxed">PeraSafe n'est pas qu'un outil de stockage. C'est une extension de votre esprit stratégique, conçue pour l'ère de la collaboration chiffrée.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-2 gap-6 h-auto md:h-[1000px]">
            {/* 01. Large Feature Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: 0.995 }}
              className="md:col-span-8 md:row-span-2 bg-white rounded-[4rem] p-12 md:p-16 text-slate-900 relative overflow-hidden group border border-slate-100 shadow-[0_40px_80px_rgba(0,0,0,0.1)]"
            >
              <div className="relative z-10 h-full flex flex-col">
                <div className="inline-block px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-600 mb-10">
                   Technologie AES-XOR
                </div>
                <div className="max-w-xl">
                   <h3 className="text-5xl md:text-6xl font-black tracking-tighter leading-[0.85] mb-8">Rédaction à haute <br />confidentialité.</h3>
                   <p className="text-slate-500 text-xl font-medium leading-relaxed mb-12">
                     Votre flux de travail est sacré. Nous le protégeons avec un environnement de rédaction minimaliste et un chiffrement qui s'exécute exclusivement sur votre processeur local.
                   </p>
                </div>
                
                {/* Mock Editor Interface */}
                <div className="mt-auto relative">
                   <div className="w-full aspect-[2/1] bg-gradient-to-br from-slate-50 to-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden p-8 flex flex-col">
                      <div className="flex justify-between items-center mb-8">
                         <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                            <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                            <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                         </div>
                         <div className="h-6 px-3 bg-indigo-600/10 border border-indigo-500/20 rounded-lg flex items-center">
                            <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">LIVE_ENCRYPT</span>
                         </div>
                      </div>
                      <div className="space-y-4">
                         <motion.div 
                           initial={{ width: 0 }}
                           whileInView={{ width: "95%" }}
                           className="h-3 bg-slate-200 rounded-full"
                         ></motion.div>
                         <motion.div 
                           initial={{ width: 0 }}
                           whileInView={{ width: "80%" }}
                           transition={{ delay: 0.2 }}
                           className="h-3 bg-slate-100 rounded-full"
                         ></motion.div>
                         <motion.div 
                           initial={{ width: 0 }}
                           whileInView={{ width: "60%" }}
                           transition={{ delay: 0.4 }}
                           className="h-3 bg-indigo-600/10 rounded-full"
                         ></motion.div>
                      </div>
                   </div>
                </div>
              </div>
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.05),_transparent_60%)] pointer-events-none"></div>
            </motion.div>

            {/* 02. AI Insight Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="md:col-span-4 bg-indigo-600 rounded-[4rem] p-12 text-white relative overflow-hidden shadow-[0_40px_80px_rgba(79,70,229,0.3)] group"
            >
              <div className="relative z-10 h-full flex flex-col">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-10 group-hover:rotate-12 transition-transform">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-3xl font-black uppercase tracking-tighter leading-none mb-6">Moteur de <br />Synthèse IA.</h4>
                <p className="text-indigo-100 text-sm font-bold leading-relaxed mb-10 opacity-80">
                  Extrayez l'essentiel de vos protocoles les plus complexes sans jamais exposer vos données à l'extérieur.
                </p>
                <div className="mt-auto h-24 bg-white/10 rounded-3xl border border-white/10 backdrop-blur-md flex items-center justify-center">
                   <div className="flex gap-2">
                       <motion.div animate={{ height: [10, 30, 10] }} transition={{ duration: 1, repeat: Infinity }} className="w-1.5 bg-white/30 rounded-full" />
                       <motion.div animate={{ height: [20, 40, 20] }} transition={{ duration: 1.2, repeat: Infinity }} className="w-1.5 bg-white/50 rounded-full" />
                       <motion.div animate={{ height: [15, 35, 15] }} transition={{ duration: 1.1, repeat: Infinity }} className="w-1.5 bg-white/30 rounded-full" />
                   </div>
                </div>
              </div>
            </motion.div>

            {/* 03. Partner Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="md:col-span-4 bg-[#F2AF31] rounded-[4rem] p-12 text-slate-900 relative overflow-hidden shadow-[0_40px_80px_rgba(242,175,49,0.2)] group"
            >
               <div className="relative z-10 h-full flex flex-col">
                <div className="w-14 h-14 bg-black/5 rounded-2xl flex items-center justify-center mb-10 group-hover:-rotate-12 transition-transform">
                  <Users className="w-8 h-8 text-slate-900" />
                </div>
                <h4 className="text-3xl font-black uppercase tracking-tighter leading-none mb-6">Vault Partenaire <br />Invité.</h4>
                <p className="text-slate-800/60 text-sm font-bold leading-relaxed mb-6">
                  Le partage ultra-sécurisé par email. Vos collaborateurs n'ont besoin que de leur code d'accès personnel.
                </p>
                <div className="mt-auto flex -space-x-4">
                   {[...Array(4)].map((_, i) => (
                      <div key={i} className="w-12 h-12 rounded-2xl bg-white border-4 border-[#F2AF31] flex items-center justify-center overflow-hidden shadow-xl">
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                           <User className="w-6 h-6 text-slate-300" />
                        </div>
                      </div>
                   ))}
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/20 blur-[60px] rounded-full pointer-events-none"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-4">Ils nous font <br />confiance.</h2>
            <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Parole de leaders stratégiques</p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                name: "Dramane Konaté",
                role: "Directeur Juridique",
                text: "La simplicité du chiffrement local nous a permis de sécuriser nos contrats sensibles sans changer nos habitudes. Un outil robuste qui respecte enfin la confidentialité promise.",
                initials: "DK"
              },
              {
                name: "Amandine Lefebvre",
                role: "Consultante en Stratégie",
                text: "Ce que j'apprécie, c'est l'absence totale de stockage cloud traditionnel. Mes analyses stratégiques restent dans mon périmètre exclusif, sans risque de fuite externe.",
                initials: "AL"
              },
              {
                name: "Jean-Marc Zadi",
                role: "Fondateur de TechFlow",
                text: "Le moteur d'indexation interne est d'une efficacité redoutable. Obtenir des synthèses claires sans jamais exposer nos secrets industriels est un avantage concurrentiel majeur.",
                initials: "JZ"
              }
            ].map((t, i) => (
              <div 
                key={i}
                className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
                    {t.initials}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm uppercase leading-tight">{t.name}</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.role}</span>
                  </div>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed italic">"{t.text}"</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 md:py-40 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 uppercase">Des tarifs adaptés <br />à votre ambition.</h2>
            <p className="text-slate-500 max-w-xl mx-auto font-medium">Choisissez le niveau de puissance dont votre organisation a besoin pour sécuriser ses actifs intellectuels.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {/* Standard */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 flex flex-col items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Essentiel</span>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Standard</h3>
              <div className="text-4xl font-black text-slate-900 mb-8">500<span className="text-sm font-bold text-slate-400 ml-2 uppercase">FCFA / mois</span></div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="text-sm font-bold text-slate-500 flex items-center justify-center gap-2">5 documents stratégiques</li>
                <li className="text-sm font-bold text-slate-500 flex items-center justify-center gap-2">Chiffrement AES-256</li>
                <li className="text-sm font-bold text-slate-500 flex items-center justify-center gap-2">Support Email</li>
              </ul>
              <button onClick={onStart} className="w-full bg-slate-100 text-slate-900 font-black py-4 rounded-3xl text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Démarrer</button>
            </div>

            {/* Pro */}
            <div className="bg-indigo-600 p-10 rounded-[3rem] shadow-2xl shadow-indigo-600/30 flex flex-col items-center text-white scale-105 z-10">
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-4">Recommandé</span>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">PeraSafe Pro</h3>
              <div className="text-4xl font-black mb-8">2000<span className="text-sm font-bold text-indigo-300 ml-2 uppercase">FCFA / mois</span></div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="text-sm font-bold text-indigo-100 flex items-center justify-center gap-2">50 documents stratégiques</li>
                <li className="text-sm font-bold text-indigo-100 flex items-center justify-center gap-2">Vaults Multi-clés</li>
                <li className="text-sm font-bold text-indigo-100 flex items-center justify-center gap-2">Analyses Stratégiques Illimitées</li>
              </ul>
              <button onClick={onStart} className="w-full bg-white text-indigo-600 font-black py-4 rounded-3xl text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Choisir Pro</button>
            </div>

            {/* Business */}
            <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Enterprise</span>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Business</h3>
              <div className="text-4xl font-black mb-8">5500<span className="text-sm font-bold text-slate-400 ml-2 uppercase">FCFA / mois</span></div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="text-sm font-bold text-slate-400 flex items-center justify-center gap-2">300 documents stratégiques</li>
                <li className="text-sm font-bold text-slate-400 flex items-center justify-center gap-2">Gestion Multi-utilisateurs</li>
                <li className="text-sm font-bold text-slate-400 flex items-center justify-center gap-2">Audit de Sécurité Live</li>
              </ul>
              <button onClick={onStart} className="w-full bg-white/10 text-white font-black py-4 rounded-3xl text-xs uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all">Contacter Sales</button>
            </div>
          </div>
        </div>
      </section>

      <InterfaceWalkthrough />

      {/* Visual Showcase (Masonry / Floating Layered Images) */}
      <section className="py-24 md:py-40 bg-[#F2AF31] overflow-hidden relative">
        {/* Background Text */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] select-none pointer-events-none">
           <span className="text-[20rem] font-black uppercase tracking-tighter text-black">PERASAFE</span>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 space-y-8">
               <motion.div
                 initial={{ opacity: 0, x: -20 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 className="inline-flex items-center gap-2 px-3 py-1 bg-black/10 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-[0.2em]"
               >
                 <ShieldCheck className="w-3 h-3" /> Architecture de Confiance
               </motion.div>
               <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 uppercase leading-none">
                 Une interface <br />
                 <span className="opacity-60">conçue pour</span> <br />
                 l'excellence.
               </h2>
               <p className="text-slate-800 text-lg font-medium leading-relaxed max-w-md">
                 Nous avons éliminé tout le superflu pour ne laisser que l'essentiel : la sécurité et votre productivité. 
               </p>
               <div className="pt-8">
                  <button 
                    onClick={onStart}
                    className="group flex items-center gap-4 text-slate-900 font-black uppercase tracking-widest text-sm hover:gap-8 transition-all"
                  >
                    Explorer l'écosystème <ArrowRight className="w-5 h-5 text-slate-900 group-hover:translate-x-2 transition-transform" />
                  </button>
               </div>
            </div>

            <div className="lg:col-span-7 relative">
               <div className="relative h-[600px] w-full">
                  {/* Main Large Image (Floating UI) */}
                  <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`absolute top-0 right-0 w-[80%] aspect-[4/3] bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.15)] overflow-hidden z-20 flex items-center justify-center ${systemSettings?.landingImages?.whiteBlockUrl ? '' : 'border border-black/5 p-2'}`}
                  >
                     {systemSettings?.landingImages?.whiteBlockUrl ? (
                         <img src={systemSettings.landingImages.whiteBlockUrl} alt="Architecture White" className="w-full h-full object-cover rounded-[3rem]" />
                     ) : (
                         <div className="w-full h-full bg-slate-50 p-8 rounded-[2.8rem]">
                            <div className="w-full h-full border border-slate-200 rounded-2xl bg-white shadow-sm flex flex-col p-6 space-y-4">
                               <div className="h-10 w-full bg-slate-50 rounded-xl" />
                               <div className="flex-1 grid grid-cols-2 gap-4">
                                  <div className="bg-slate-50 rounded-xl" />
                                  <div className="bg-slate-50 rounded-xl" />
                               </div>
                            </div>
                         </div>
                     )}
                  </motion.div>

                  {/* Secondary Image (Black Card) */}
                  <motion.div 
                    initial={{ x: -100, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                    className={`absolute bottom-10 left-0 w-[50%] aspect-square bg-slate-900 rounded-[3rem] shadow-2xl z-30 overflow-hidden flex items-center justify-center ${systemSettings?.landingImages?.blackBlockUrl ? '' : 'border border-white/5 p-2'}`}
                  >
                     {systemSettings?.landingImages?.blackBlockUrl ? (
                         <img src={systemSettings.landingImages.blackBlockUrl} alt="Architecture Black" className="w-full h-full object-cover rounded-[3rem]" />
                     ) : (
                         <div className="w-full h-full p-10 flex flex-col rounded-[2.8rem] border border-white/5">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl mb-auto" />
                            <div className="h-4 w-2/3 bg-white/10 rounded-full mb-3" />
                            <div className="h-4 w-1/2 bg-white/5 rounded-full" />
                         </div>
                     )}
                  </motion.div>

                  {/* Accent Circle */}
                  <motion.div 
                    animate={{ 
                       scale: [1, 1.1, 1],
                       rotate: [0, 90, 180, 270, 360]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-10 -right-10 w-32 h-32 border-2 border-slate-900/10 border-dashed rounded-full z-10"
                  ></motion.div>

                  {/* Decorative Blur Spot */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/40 blur-[120px] rounded-full pointer-events-none"></div>
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* Trust Grid */}
      <section id="security" className="relative py-24 md:py-40 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="flex-1 space-y-10">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9]">Sécurité de <br />niveau bancaire.</h2>
              <div className="space-y-6">
                {[
                  "Chiffrement AES-256 local-first",
                  "Double authentification biométrique",
                  "Zéro accès serveur (Zero-Knowledge)",
                  "Destruction automatique réglable"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-lg font-bold text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={onViewProtocol}
                className="inline-flex items-center gap-3 text-indigo-600 font-black uppercase tracking-widest text-sm border-b-2 border-indigo-600 pb-2 hover:gap-6 transition-all"
              >
                Tout savoir sur notre protocole <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 w-full relative">
              <ParallaxSecuritySpace />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-indigo-600 rounded-[4rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-3xl">
             <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
             >
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-10 uppercase leading-[0.85]">Prêt pour la <br />guerre des idées ?</h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button 
                    onClick={onStart}
                    className="w-full sm:w-auto bg-white text-indigo-600 px-8 py-4 rounded-full text-base font-black uppercase tracking-widest shadow-2xl shadow-white/20 hover:scale-105 transition-all"
                  >
                    COMMENCER GRATUITEMENT
                  </button>
                  <button 
                    onClick={onLogin}
                    className="w-full sm:w-auto bg-[#F2AF31] text-slate-900 px-8 py-4 rounded-full text-base font-black uppercase tracking-widest hover:brightness-105 transition-all shadow-xl hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <User className="w-5 h-5" /> Lire un Document Invité
                  </button>
                </div>
                <p className="text-indigo-200 text-sm font-bold uppercase tracking-widest mt-6">Aucune carte bancaire requise.</p>
             </motion.div>
             {/* Abs shapes */}
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-3">
              <div className="bg-slate-900 p-2 rounded-lg">
                <ShieldCheck className="text-white w-4 h-4" />
              </div>
              <span className="text-sm font-black tracking-tighter uppercase">PERASafe © 2026</span>
           </div>
           <div className="flex gap-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <button onClick={onViewPrivacy} className="hover:text-indigo-600">Légal</button>
              <button onClick={onViewPrivacy} className="hover:text-indigo-600">Confidentialité</button>
              <button onClick={() => window.open('mailto:support@perasafe.cloud')} className="hover:text-indigo-600">Contact</button>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
