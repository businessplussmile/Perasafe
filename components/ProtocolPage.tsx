
import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, Zap, EyeOff, Globe, Award, ChevronLeft, ArrowRight, CheckCircle, Activity, Fingerprint } from 'lucide-react';

interface ProtocolPageProps {
  onBack: () => void;
  onSubscribe: () => void;
}

const ProtocolPage: React.FC<ProtocolPageProps> = ({ onBack, onSubscribe }) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-yellow-200 selection:text-slate-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-8 border-b border-slate-100 backdrop-blur-3xl bg-white/80">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button 
            onClick={onBack}
            className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-900 transition-all"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Retour
          </button>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.4)]">
               <ShieldCheck className="w-4 h-4 text-slate-900" />
             </div>
             <span className="text-xs font-black tracking-widest uppercase text-slate-900">Protocol X-14</span>
          </div>
          <button 
            onClick={onSubscribe}
            className="hidden sm:block px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-all"
          >
            S'abonner maintenant
          </button>
        </div>
      </nav>

      {/* Hero Section - The Secret */}
      <section className="pt-48 pb-32 px-6 relative">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full border border-yellow-400 text-yellow-600 text-[9px] font-black uppercase tracking-[0.4em] mb-12 animate-pulse">
              Confidentialité de Niveau 5 activée
            </span>
            <h1 className="text-5xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85] mb-12 uppercase text-slate-900">
              La fin de la <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600">Vulnérabilité</span>.
            </h1>
            <p className="max-w-3xl mx-auto text-slate-500 text-lg md:text-2xl font-light leading-relaxed mb-16 px-4">
              PeraSafe n'est pas qu'un logiciel. C'est une armure numérique forgée dans le silence pour ceux qui façonnent le futur. 
              Vos idées valent des fortunes. Notre protocole est là pour qu'elles restent les vôtres.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={onSubscribe}
                className="w-full sm:w-auto px-12 py-6 bg-yellow-400 text-slate-900 rounded-2xl text-lg font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(250,204,21,0.3)] hover:scale-105 hover:bg-yellow-500 transition-all flex items-center justify-center gap-4"
              >
                Rejoindre l'Elite <ArrowRight className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <Activity className="w-4 h-4 text-yellow-500" /> 128 Audits réussis ce mois-ci
              </div>
            </div>
          </motion.div>
        </div>

        {/* Dynamic Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-full h-full max-w-6xl">
           <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-[120px] animate-pulse"></div>
           <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-400/10 rounded-full blur-[100px]"></div>
        </div>
      </section>

      {/* The Psychological Trigger - Fear & Solution */}
      <section className="py-32 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
             <div className="space-y-12">
                <div className="space-y-4">
                   <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-slate-900">Le coût de <br />l'insécurité</h2>
                   <p className="text-slate-500 font-medium text-lg leading-relaxed">
                     Chaque seconde, des milliers d'idées confidentielles sont interceptées. 
                     Une seule fuite peut anéantir des années de travail stratégique. 
                     Pouvez-vous vraiment vous permettre de parier sur la "chance" ?
                   </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                   {[
                     { icon: EyeOff, title: "Zéro Visibilité", desc: "Même nous ne pouvons pas voir vos fichiers. Jamais." },
                     { icon: Fingerprint, title: "Biométrie Native", desc: "Votre identité est la seule clé qui existe." },
                     { icon: Zap, title: "Action Instantanée", desc: "Chiffrement AES-256 en moins de 0.2ms." },
                     { icon: Award, title: "Standard Premium", desc: "Utilisé par les investisseurs de premier plan." }
                   ].map((feature, i) => (
                     <div key={i} className="p-6 rounded-[2rem] border border-slate-200 bg-white hover:border-yellow-400 transition-all group shadow-sm hover:shadow-xl">
                        <feature.icon className="w-8 h-8 text-yellow-500 mb-4 group-hover:scale-110 transition-transform" />
                        <h4 className="text-sm font-black uppercase tracking-widest mb-2 text-slate-900">{feature.title}</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed uppercase font-bold">{feature.desc}</p>
                     </div>
                   ))}
                </div>
             </div>
             
             {/* The "Dopamine" Visual - High End Render UI */}
             <div className="relative">
                <motion.div 
                  initial={{ rotateY: 15, rotateX: 10 }}
                  whileInView={{ rotateY: 0, rotateX: 0 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="bg-gradient-to-br from-slate-100 to-white rounded-[3rem] p-1 border border-slate-200 shadow-[0_40px_100px_rgba(0,0,0,0.1)] overflow-hidden"
                >
                   <div className="bg-white p-8 md:p-12 h-full rounded-[2.85rem]">
                      <div className="flex justify-between items-center mb-12">
                         <div className="flex gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                         </div>
                         <div className="px-3 py-1 bg-slate-100 rounded-full text-[8px] font-black text-yellow-600 uppercase tracking-widest">
                            Audit Live : OK
                         </div>
                      </div>
                      
                      <div className="space-y-8">
                         <div className="h-4 w-1/2 bg-slate-100 rounded-full"></div>
                         <div className="space-y-4">
                            <div className="h-2 w-full bg-slate-50 rounded-full"></div>
                            <div className="h-2 w-full bg-slate-50 rounded-full"></div>
                            <div className="h-2 w-3/4 bg-slate-50 rounded-full"></div>
                         </div>
                         
                         <div className="p-8 rounded-[2rem] border border-yellow-400 bg-yellow-50 relative overflow-hidden group">
                             <div className="relative z-10">
                                <span className="text-[9px] font-black text-yellow-600 uppercase tracking-widest mb-2 block">Statut du Coffre</span>
                                <div className="text-2xl font-black uppercase tracking-tighter text-slate-900">PROTOCOLE X-14 ACTIF</div>
                                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                   <div className="w-1 h-1 rounded-full bg-yellow-500 animate-ping"></div>
                                   Protection Intégrale en cours
                                </div>
                             </div>
                             <Lock className="absolute -right-4 -bottom-4 w-24 h-24 text-yellow-400/20 group-hover:scale-110 transition-transform" />
                         </div>
                      </div>
                   </div>
                </motion.div>
                
                {/* Floaties */}
                <div className="absolute top-10 -right-10 w-24 h-24 bg-yellow-400/20 rounded-full blur-2xl animate-bounce"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl"></div>
             </div>
          </div>
        </div>
      </section>

      {/* Social Proof - Exclusivity */}
      <section className="py-40 px-6 border-b border-slate-100">
        <div className="max-w-7xl mx-auto text-center">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[1em] mb-20 animate-pulse">L'écosystème de confiance</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { number: "24h", label: "Durée de vie des documents" },
                { number: "100%", label: "Taux de réussite des audits" },
                { number: "256bit", label: "Force du Chiffrement" }
              ].map((stat, i) => (
                <div key={i} className="space-y-2">
                   <div className="text-5xl md:text-7xl font-black tracking-tighter text-yellow-500">{stat.number}</div>
                   <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* CTA Section - The Closing */}
      <section className="py-40 px-6">
         <div className="max-w-4xl mx-auto text-center space-y-16">
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-none text-slate-900">
              Prêt à sécuriser <br /> votre <span className="italic font-serif normal-case">Légende</span> ?
            </h2>
            <div className="space-y-8">
               <button 
                  onClick={onSubscribe}
                  className="w-full sm:w-auto px-16 py-8 bg-slate-900 text-white rounded-3xl text-xl font-black uppercase tracking-widest shadow-[0_30px_60px_rgba(0,0,0,0.1)] hover:scale-105 active:scale-95 transition-all"
               >
                  Activer mon accès maintenant
               </button>
               <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">
                  Installation instantanée. Annulation à tout moment.
               </p>
            </div>
         </div>
      </section>

      <footer className="py-20 px-6 border-t border-slate-100">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                   <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <div className="text-left">
                   <div className="text-xs font-black uppercase tracking-widest text-slate-900">PeraSafe Protocol</div>
                   <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Sécurité Souveraine © 2026</div>
                </div>
             </div>
             <div className="flex gap-8">
                <button onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Politique</button>
                <button onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Mentions</button>
                <button onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Contact</button>
             </div>
         </div>
      </footer>
    </div>
  );
};

export default ProtocolPage;
