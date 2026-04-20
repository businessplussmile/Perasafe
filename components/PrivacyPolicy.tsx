
import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ArrowLeft, Lock, EyeOff, Shield, Database, Trash2, CheckCircle } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-900 font-sans selection:bg-yellow-200">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-6 transition-all">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <div className="flex items-center gap-3">
             <div className="bg-yellow-400 p-2 rounded-lg shadow-lg shadow-yellow-400/20">
               <ShieldCheck className="text-slate-900 w-4 h-4" />
             </div>
             <span className="text-xs font-black tracking-tighter uppercase">Confidentialité</span>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-16">
              <span className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.3em] mb-4 block">Standard PERASafe X-14</span>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 mb-8 uppercase leading-tight">
                Votre vie privée est <br />notre <span className="text-yellow-500 italic font-serif normal-case">Obsession</span>.
              </h1>
              <p className="text-slate-500 text-lg font-medium leading-relaxed italic border-l-4 border-yellow-400 pl-6">
                Chez PERASafe, nous croyons qu'une donnée n'est réellement sécurisée que lorsqu'elle n'est visible par personne — pas même par nous.
              </p>
            </div>

            <div className="space-y-16">
              {/* Section 1: Zero Knowledge */}
              <section className="space-y-6">
                <div className="flex items-center gap-4 text-slate-900">
                   <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center">
                      <Lock className="w-5 h-5" />
                   </div>
                   <h2 className="text-xl font-black uppercase tracking-tight">1. Souveraineté "Zero-Knowledge"</h2>
                </div>
                <p className="text-slate-600 leading-relaxed font-medium">
                  Nous appliquons un protocole de connaissance nulle (Zero-Knowledge). Cela signifie que vos contenus confidentiels sont chiffrés sur votre terminal avant d'atteindre nos serveurs. Nous ne possédons pas vos clés de déchiffrement et il nous est techniquement impossible d'accéder à vos documents.
                </p>
              </section>

              {/* Section 2: Data Collection */}
              <section className="space-y-6">
                <div className="flex items-center gap-4 text-slate-900">
                   <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                      <Database className="w-5 h-5" />
                   </div>
                   <h2 className="text-xl font-black uppercase tracking-tight">2. Collecte des Données</h2>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Nous collectons uniquement :</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "Identifiants de compte (Email, Nom)",
                      "Profil d'entreprise (Onboarding)",
                      "Métadonnées de fichiers (Taille, Date)",
                      "Journal de sécurité des accès"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <CheckCircle className="w-4 h-4 text-yellow-500" /> {item}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-slate-400 font-medium italic mt-6">
                    Note : Le contenu de vos documents n'est jamais collecté en clair. Il est stocké sous forme de ciphertext indéchiffrable.
                  </p>
                </div>
              </section>

              {/* Section 3: Internal Processing */}
              <section className="space-y-6">
                <div className="flex items-center gap-4 text-slate-900">
                   <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                      <EyeOff className="w-5 h-5 text-yellow-500" />
                   </div>
                   <h2 className="text-xl font-black uppercase tracking-tight">3. Intelligence Locale & Indépendante</h2>
                </div>
                <p className="text-slate-600 leading-relaxed font-medium">
                  Contrairement aux solutions standard, PERASafe n'envoie aucune de vos données à des services tiers d'Intelligence Artificielle. Notre moteur d'indexation est strictement interne. L'analyse heuristique et le traitement des documents se font au sein de notre infrastructure souveraine protégée.
                </p>
              </section>

              {/* Section 4: Your Rights */}
              <section className="space-y-6">
                <div className="flex items-center gap-4 text-slate-900">
                   <div className="w-10 h-10 bg-yellow-500 text-white rounded-xl flex items-center justify-center animate-pulse">
                      <Trash2 className="w-5 h-5" />
                   </div>
                   <h2 className="text-xl font-black uppercase tracking-tight">4. Droit à l'Oubli Stratégique</h2>
                </div>
                <p className="text-slate-600 leading-relaxed font-medium">
                  Vous avez le contrôle total sur la fin de vie de vos données. À tout moment, vous pouvez supprimer un document, une entreprise ou un compte utilisateur. Cette suppression est immédiate et irrévocable, purgeant les données de nos bases de production instantanément.
                </p>
              </section>

              {/* Security Badge */}
              <div className="p-12 rounded-[3.5rem] bg-slate-900 text-white text-center relative overflow-hidden">
                <div className="relative z-10">
                   <Shield className="w-12 h-12 text-yellow-400 mx-auto mb-8 animate-bounce" />
                   <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Certifié PERAFIND SECURE-NODE</h3>
                   <p className="text-slate-400 text-sm font-medium uppercase tracking-widest leading-loose">
                     Chiffrement AES-256 local-first <br />
                     Souveraineté des données garantie <br />
                     Zéro traçage publicitaire
                   </p>
                </div>
                {/* Background glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-400/10 rounded-full blur-[80px]"></div>
              </div>
            </div>

            <footer className="mt-20 pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dernière mise à jour : 20 Avril 2026</div>
              <div className="flex gap-6">
                 <button onClick={onBack} className="text-[10px] font-black text-yellow-600 uppercase tracking-widest hover:text-yellow-700 transition-colors underline decoration-yellow-400 underline-offset-4">J'accepte les conditions</button>
              </div>
            </footer>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
