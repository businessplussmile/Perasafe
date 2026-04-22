import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { db } from '../services/firebaseService';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { CheckCircle2, Building, Phone, Briefcase, ChevronRight, ShieldCheck, Clock, User } from 'lucide-react';

interface OnboardingFlowProps {
  profile: UserProfile;
  onComplete?: () => void;
  onReturnToLanding?: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ profile, onComplete, onReturnToLanding }) => {
  const [step, setStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState<'FREE' | 'STANDARD' | 'PRO' | 'BUSINESS'>('FREE');
  const [formData, setFormData] = useState({
    companyName: '',
    phone: '',
    sector: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already pending, show the pending screen directly
  if (profile.subscriptionStatus === 'PENDING' && !profile.onboardingCompleted) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white max-w-md w-full rounded-3xl p-10 shadow-2xl border border-slate-100 text-center animate-modal-in">
          <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">Validation en cours</h2>
          <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
            Votre demande d'accès pour le plan <span className="font-bold text-indigo-600">{profile.requestedTier}</span> est actuellement en d'analyse par notre équipe d'administration. 
          </p>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Détails de l'organisation</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700"><Building className="w-3 h-3 text-slate-400" /> {profile.onboardingData?.companyName || '-'}</div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700"><Briefcase className="w-3 h-3 text-slate-400" /> {profile.onboardingData?.sector || '-'}</div>
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-8">Vous recevrez un notification dès l'activation.</p>
          {onReturnToLanding && (
            <button 
              onClick={onReturnToLanding}
              className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
            >
              Retour à l'accueil
            </button>
          )}
        </div>
      </div>
    );
  }

  const handlePartnerAccess = async () => {
    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        onboardingCompleted: true,
        // We keep them as COMPANY_OWNER so they can still create their own docs later
        // without having to "re-create" an account.
        subscriptionStatus: 'ACTIVE',
        subscriptionTier: 'FREE' 
      });
      if (onComplete) onComplete();
    } catch (error) {
       console.error("Partner setup error:", error);
       alert("Erreur de configuration du compte partenaire.");
    } finally {
       setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.phone || !formData.sector) return;
    setIsSubmitting(true);
    
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        subscriptionStatus: selectedTier === 'FREE' ? 'ACTIVE' : 'PENDING',
        subscriptionTier: selectedTier === 'FREE' ? 'FREE' : profile.subscriptionTier,
        requestedTier: selectedTier,
        onboardingData: formData,
        onboardingCompleted: true
      });
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error submitting onboarding:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase">PERASafe</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-1.5 w-10 rounded-full ${step >= 1 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
          <div className={`h-1.5 w-10 rounded-full ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-24">
        <div className="max-w-4xl w-full">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full"
              >
                <div className="text-center mb-12">
                  <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4">Sélectionnez votre puissance de sécurité</h1>
                  <p className="text-slate-500 font-medium max-w-lg mx-auto">Avant d'activer votre espace cloud protégé, veuillez choisir le niveau d'infrastructure adapté à votre organisation.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Free */}
                  <div 
                    onClick={() => setSelectedTier('FREE')}
                    className={`p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer flex flex-col h-full bg-white relative ${selectedTier === 'FREE' ? 'border-indigo-600 shadow-xl shadow-indigo-600/10' : 'border-slate-100 hover:border-slate-300'}`}
                  >
                    {selectedTier === 'FREE' && <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center"><CheckCircle2 className="w-4 h-4" /></div>}
                    <div className="mb-4 mt-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Découverte</span>
                      <h3 className="text-2xl font-black uppercase tracking-tighter mb-1 mt-1">Essai</h3>
                      <div className="text-3xl font-black text-slate-900 mb-6">0<span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">FCFA</span></div>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                      <li className="text-xs font-bold text-slate-600 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> 1 document (10 pages max)</li>
                      <li className="text-xs font-bold text-slate-600 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> 1 partenaire max</li>
                    </ul>
                  </div>

                  {/* Standard */}
                  <div 
                    onClick={() => setSelectedTier('STANDARD')}
                    className={`p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer flex flex-col h-full bg-white relative ${selectedTier === 'STANDARD' ? 'border-indigo-600 shadow-xl shadow-indigo-600/10' : 'border-slate-100 hover:border-slate-300'}`}
                  >
                    {selectedTier === 'STANDARD' && <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center"><CheckCircle2 className="w-4 h-4" /></div>}
                    <div className="mb-4 mt-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Essentiel</span>
                      <h3 className="text-2xl font-black uppercase tracking-tighter mb-1 mt-1">Standard</h3>
                      <div className="text-3xl font-black text-slate-900 mb-6">500<span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">FCFA/mois</span></div>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                      <li className="text-xs font-bold text-slate-600 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> 5 documents stratégiques</li>
                      <li className="text-xs font-bold text-slate-600 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> 3 partenaires max</li>
                      <li className="text-xs font-bold text-slate-600 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Chiffrement AES-256</li>
                    </ul>
                  </div>

                  {/* Pro */}
                  <div 
                    onClick={() => setSelectedTier('PRO')}
                    className={`p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer flex flex-col h-full bg-white relative ${selectedTier === 'PRO' ? 'border-indigo-600 shadow-xl shadow-indigo-600/10' : 'border-slate-100 hover:border-slate-300'}`}
                  >
                    {selectedTier === 'PRO' && <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center"><CheckCircle2 className="w-4 h-4" /></div>}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Recommandé</div>
                    <div className="mb-4 mt-2">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Équipe</span>
                      <h3 className="text-2xl font-black uppercase tracking-tighter mb-1 mt-1">PRO</h3>
                      <div className="text-3xl font-black text-slate-900 mb-6">2000<span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">FCFA/mois</span></div>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                      <li className="text-xs font-bold text-slate-600 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> 50 documents stratégiques</li>
                      <li className="text-xs font-bold text-slate-600 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Assistance Automatisée Illimitée</li>
                    </ul>
                  </div>

                  {/* Business */}
                  <div 
                    onClick={() => setSelectedTier('BUSINESS')}
                    className={`p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer flex flex-col h-full bg-white relative ${selectedTier === 'BUSINESS' ? 'border-indigo-600 shadow-xl shadow-indigo-600/10' : 'border-slate-100 hover:border-slate-300'}`}
                  >
                    {selectedTier === 'BUSINESS' && <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center"><CheckCircle2 className="w-4 h-4" /></div>}
                    <div className="mb-4 mt-2">
                       <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Enterprise</span>
                       <h3 className="text-2xl font-black uppercase tracking-tighter mb-1 mt-1">Business</h3>
                       <div className="text-3xl font-black text-slate-900 mb-6">5500<span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">FCFA/mois</span></div>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                      <li className="text-xs font-bold text-slate-600 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> 300 documents stratégiques</li>
                      <li className="text-xs font-bold text-slate-600 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Gestion Multi-utilisateurs</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-12 flex flex-col items-center gap-6">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {onReturnToLanding && (
                      <button 
                        onClick={onReturnToLanding}
                        className="px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                      >
                        Annuler / Retour
                      </button>
                    )}
                    <button 
                      onClick={handleNext}
                      className="bg-indigo-600 text-white px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all flex items-center gap-3"
                    >
                      Continuer <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="w-full max-w-sm flex items-center gap-4 my-2 opacity-50">
                    <div className="flex-1 h-[1px] bg-slate-300"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">OU</span>
                    <div className="flex-1 h-[1px] bg-slate-300"></div>
                  </div>

                  <button 
                    onClick={handlePartnerAccess}
                    disabled={isSubmitting}
                    className="group bg-white border border-slate-200 hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-600/10 text-slate-700 px-8 py-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                    <User className="w-5 h-5 text-indigo-600 transition-colors" />
                    Je suis invité à lire un document protégé
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full max-w-xl mx-auto"
              >
                <div className="text-center mb-10">
                  <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">Profil Organisation</h1>
                  <p className="text-slate-500 font-medium text-sm">Afin de valider votre protocole de sécurité pour le plan <span className="font-bold text-indigo-600">{selectedTier}</span>, veuillez certifier les informations de votre entreprise.</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Building className="w-3 h-3" /> Nom de l'organisation</label>
                     <input 
                       required 
                       type="text" 
                       name="companyName"
                       value={formData.companyName}
                       onChange={handleChange}
                       className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                       placeholder="Ex: TechCorp Inc."
                     />
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Briefcase className="w-3 h-3" /> Secteur d'activité</label>
                     <input 
                       required 
                       type="text" 
                       name="sector"
                       value={formData.sector}
                       onChange={handleChange}
                       className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                       placeholder="Ex: Finance, Juridique, Tech..."
                     />
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Phone className="w-3 h-3" /> Téléphone Professionnel</label>
                     <input 
                       required 
                       type="tel" 
                       name="phone"
                       value={formData.phone}
                       onChange={handleChange}
                       className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                       placeholder="+33 6 00 00 00 00"
                     />
                   </div>

                    <div className="mt-4 flex items-center gap-4">
                      <button 
                        type="button"
                        onClick={handleBack}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                      >
                        Retour aux forfaits
                      </button>
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-indigo-600 text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {isSubmitting ? 'Transmission...' : 'Soumettre'}
                      </button>
                    </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
