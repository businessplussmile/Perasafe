
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Zap, Lock, Users, Sparkles, ChevronRight, Play, CheckCircle2, ArrowRight } from 'lucide-react';
import ParallaxSecuritySpace from './ParallaxSecuritySpace';
import DemoPresentation from './DemoPresentation';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
  onViewProtocol: () => void;
  onViewPrivacy: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin, onViewProtocol, onViewPrivacy }) => {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

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
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 h-20 flex items-center px-6 md:px-12">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-600/20">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-black tracking-tighter uppercase">PERASafe</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500 uppercase tracking-widest">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Fonctions</a>
            <a href="#security" className="hover:text-indigo-600 transition-colors">Sécurité</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Tarifs</a>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={onLogin}
              className="px-6 py-2.5 text-sm font-black uppercase tracking-widest text-slate-900 hover:text-indigo-600 transition-colors"
            >
              Connexion
            </button>
            <button 
              onClick={onStart}
              className="bg-indigo-600 text-white px-8 py-3 rounded-full text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-105 transition-transform"
            >
              C'est parti
            </button>
          </div>
        </div>
      </header>

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

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={onStart}
                className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl text-base font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:scale-105 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
              >
                Commencer gratuitement <ChevronRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsDemoOpen(true)}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-3 group"
              >
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                </div>
                Voir Démo
              </button>
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

      {/* Main Feature Section (Adobe Express vibe with split panels) */}
      <section id="features" className="relative py-24 md:py-40 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6 uppercase">Une nouvelle ère de<br />sécurité collaborative.</h2>
            <p className="text-slate-500 max-w-xl mx-auto font-medium text-sm">Conçu pour dépasser les standards militaires, sans sacrifier l'élégance et la rapidité.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Feature 1: Drafting */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="group bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white flex flex-col h-[500px] justify-between relative overflow-hidden shadow-2xl"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-8 group-hover:bg-indigo-600 transition-colors duration-500">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl md:text-4xl font-black tracking-tighter mb-4 leading-none">Rédaction Stratégique <br />en Temps Réel.</h3>
                <p className="text-slate-400 text-base md:text-lg font-medium leading-relaxed max-w-sm">
                  Un éditeur minimaliste pour une concentration totale, avec chiffrement local instantané.
                </p>
              </div>
              <div className="mt-auto relative z-10">
                 <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-md">
                    <div className="flex gap-2 mb-4">
                       <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                       <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                       <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                    </div>
                    <p className="font-mono text-xs text-indigo-400 mb-2">PROJET_PHOENIX_PROTOC.V3</p>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: "70%" }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                        className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                       ></motion.div>
                    </div>
                 </div>
              </div>
              {/* Abs background */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-indigo-600/20 to-transparent pointer-events-none"></div>
            </motion.div>

            {/* Feature 2: AI Summary */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="group bg-indigo-50 rounded-[2.5rem] p-8 md:p-12 text-slate-900 flex flex-col h-[500px] justify-between relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-8 shadow-lg shadow-indigo-600/20">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl md:text-4xl font-black tracking-tighter mb-4 leading-none">Analyse <br />Locale Souveraine.</h3>
                <p className="text-slate-500 text-base md:text-lg font-medium leading-relaxed max-w-sm">
                  Générez des synthèses stratégiques de vos documents complexes en un clic grâce à notre moteur d'indexation souverain.
                </p>
              </div>
              <div className="mt-auto relative z-10">
                 <div className="bg-white rounded-3xl p-6 shadow-xl border border-indigo-100 animate-pulse">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">Synthèse Stratégique</p>
                    <p className="text-sm font-serif italic text-slate-600 leading-relaxed">"Les points clés de ce protocole concernent principalement l'acquisition de..."</p>
                 </div>
              </div>
              {/* Abs background */}
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-orange-200/30 blur-[80px] rounded-full pointer-events-none"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="space-y-6">
              <span className="text-6xl font-black text-white/10 italic">01</span>
              <h4 className="text-2xl font-black uppercase tracking-tighter">Rédigez</h4>
              <p className="text-slate-400 font-medium">Écrivez vos notes stratégiques dans notre environnement sanctuarisé.</p>
            </div>
            <div className="space-y-6">
              <span className="text-6xl font-black text-white/10 italic">02</span>
              <h4 className="text-2xl font-black uppercase tracking-tighter">Chiffrez</h4>
              <p className="text-slate-400 font-medium">Définissez un code d'accès unique. Les données sont chiffrées localement.</p>
            </div>
            <div className="space-y-6">
              <span className="text-6xl font-black text-white/10 italic">03</span>
              <h4 className="text-2xl font-black uppercase tracking-tighter">Partagez</h4>
              <p className="text-slate-400 font-medium">Invitez vos partenaires par email. Ils accèdent au document via leur propre vault.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Grid */}
      <section id="security" className="relative py-24 md:py-40 px-6">
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
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <button 
                    onClick={onStart}
                    className="w-full sm:w-auto bg-white text-indigo-600 px-12 py-6 rounded-full text-xl font-black uppercase tracking-widest shadow-2xl shadow-white/20 hover:scale-105 transition-all"
                  >
                    Essai Gratuit
                  </button>
                  <p className="text-indigo-200 text-sm font-bold uppercase tracking-widest">Aucune carte bancaire requise.</p>
                </div>
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
