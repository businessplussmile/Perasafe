
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { SecureDocument, ViewMode, UserProfile } from './types';
import AdminPanel from './components/AdminPanel';
import UserDocGrid from './components/UserDocGrid';
import SecureViewer from './components/SecureViewer';
import LoginPortal from './components/LoginPortal';
import GreetingAnimation from './components/GreetingAnimation';
import { encryptContent, decryptContent } from './services/geminiService';
import { useAuth } from './hooks/useAuth';
import { db, signOut } from './services/firebaseService';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, setDoc, addDoc, serverTimestamp, getDoc, collectionGroup } from 'firebase/firestore';
import { LogOut, ShieldCheck, Settings, Users, PieChart, CreditCard, ChevronRight, Bell, Search, Plus } from 'lucide-react';

const LIFESPAN_MS = 24 * 60 * 60 * 1000; // 24 heures

// Composants mémoïsés pour éviter les re-rendus inutiles de toute l'application
const MemoizedUserDocGrid = React.memo(UserDocGrid);
const MemoizedAdminPanel = React.memo(AdminPanel);

const App: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [showGreeting, setShowGreeting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('USER');
  const [documents, setDocuments] = useState<SecureDocument[]>([]);
  const [activeDoc, setActiveDoc] = useState<SecureDocument | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  // Synchronisation avec Firestore
  useEffect(() => {
    if (!profile) {
      setDocuments([]);
      return;
    }

    let q;
    if (profile.role === 'COMPANY_OWNER') {
      // Les entreprises voient leurs propres documents
      q = query(collection(db, 'companies', profile.companyId || 'default', 'documents'));
    } else {
      // Les partenaires voient les documents où ils sont listés via collectionGroup
      q = query(collectionGroup(db, 'documents'), where('partnerIds', 'array-contains', profile.email));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: SecureDocument[] = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as SecureDocument));
      setDocuments(docs.sort((a, b) => b.createdAt - a.createdAt));
    });

    return () => unsubscribe();
  }, [profile]);

  // Vérification périodique optimisée de l'expiration
  useEffect(() => {
    const checkExpiration = async () => {
      if (!profile || profile.role !== 'COMPANY_OWNER') return;

      const now = Date.now();
      for (const docItem of documents) {
        if (docItem.lifespanStart && !docItem.isConsumed) {
          if (now - docItem.lifespanStart >= LIFESPAN_MS) {
            const docRef = doc(db, 'companies', profile.companyId!, 'documents', docItem.id);
            await updateDoc(docRef, { isConsumed: true });
          }
        }
      }
    };

    const timer = setInterval(checkExpiration, 10000); 
    return () => clearInterval(timer);
  }, [documents, profile]);

  const switchView = useCallback((mode: ViewMode, doc: SecureDocument | null = null) => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setActiveDoc(doc);
      setViewMode(mode);
      setTransitioning(false);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 250);
  }, [transitioning]);

  const handleGreetingComplete = useCallback(() => {
    setShowGreeting(false);
  }, []);

  const addDocument = useCallback(async (docData: Omit<SecureDocument, 'id' | 'createdAt' | 'isConsumed' | 'companyId' | 'uploaderId'>) => {
    if (!profile || profile.role !== 'COMPANY_OWNER') return;

    const encryptedContent = encryptContent(docData.content, docData.accessCode);
    const newDocRef = collection(db, 'companies', profile.companyId!, 'documents');
    
    await addDoc(newDocRef, {
      ...docData,
      content: encryptedContent,
      createdAt: Date.now(),
      isConsumed: false,
      companyId: profile.companyId,
      uploaderId: profile.uid,
      partnerIds: docData.partnerIds || []
    });
  }, [profile]);

  const onOpenDocRequest = useCallback(async (document: SecureDocument, code: string) => {
    if (!profile) return;
    const now = Date.now();
    
    if (document.isConsumed || (document.lifespanStart && now - document.lifespanStart >= LIFESPAN_MS)) {
      alert("Ce document a expiré. Contactez l'administrateur.");
      return;
    }

    const docRef = doc(db, 'companies', document.companyId, 'documents', document.id);
    const updates = {
      lifespanStart: document.lifespanStart || now,
      lastCodeUsedAtOpening: code
    };

    await updateDoc(docRef, updates);
    switchView('VIEWER', { ...document, ...updates });
  }, [switchView, profile]);

  const updateDocCode = useCallback(async (id: string, newCode: string) => {
    if (!profile || profile.role !== 'COMPANY_OWNER') return false;

    const document = documents.find(d => d.id === id);
    if (!document) return false;

    const originalContent = decryptContent(document.content, document.accessCode);
    if (originalContent.includes("ERREUR DE DÉCHIFFREMENT")) return false;

    const newEncryptedContent = encryptContent(originalContent, newCode);
    const docRef = doc(db, 'companies', profile.companyId!, 'documents', id);
    
    await updateDoc(docRef, { 
      accessCode: newCode,
      content: newEncryptedContent,
      isConsumed: false,
      lifespanStart: null,
      lastCodeUsedAtOpening: null
    });
    return true;
  }, [profile, documents]);

  const toggleDocStatus = useCallback(async (id: string) => {
    if (!profile || profile.role !== 'COMPANY_OWNER') return;
    const document = documents.find(d => d.id === id);
    if (!document) return;

    const docRef = doc(db, 'companies', profile.companyId!, 'documents', id);
    await updateDoc(docRef, { isConsumed: !document.isConsumed });
  }, [profile, documents]);

  const executeDelete = useCallback(async () => {
    if (!docToDelete || !profile) return;
    
    const docRef = doc(db, 'companies', profile.companyId!, 'documents', docToDelete);
    await deleteDoc(docRef);
    
    if (activeDoc?.id === docToDelete) switchView('USER');
    setDocToDelete(null);
  }, [docToDelete, activeDoc, switchView, profile]);

  const handleSignOut = () => {
    signOut();
    switchView('USER');
  };

  const header = useMemo(() => (
    viewMode !== 'VIEWER' && (
      <header className="glass-light sticky top-0 z-50 px-4 md:px-12 py-4 md:py-5 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 md:gap-5 cursor-pointer btn-active transition-all" onClick={() => switchView('USER')}>
            <div className="bg-indigo-600 p-2.5 md:p-3 rounded-xl md:rounded-2xl shadow-xl shadow-indigo-600/20">
              < ShieldCheck className="text-white w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="hidden xs:block">
              <span className="text-lg md:text-xl font-black tracking-tighter text-slate-900 uppercase block leading-none">PERASafe</span>
              <span className="text-[8px] md:text-[10px] text-indigo-600 font-bold tracking-[0.2em] md:tracking-[0.3em] uppercase opacity-70">Enterprise Cloud</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {profile && (
              <div className="hidden lg:flex items-center gap-3 mr-4 px-4 py-2 bg-slate-100 rounded-full border border-slate-200/50">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest truncate max-w-[150px]">
                  {profile.email} ({profile.role})
                </span>
                {profile.role === 'COMPANY_OWNER' && (
                  <button 
                    onClick={() => setIsSubscriptionModalOpen(true)}
                    className="ml-2 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase"
                  >
                    PREMIUM
                  </button>
                )}
              </div>
            )}

            {profile?.role === 'COMPANY_OWNER' && (
              <button 
                onClick={() => switchView(viewMode === 'ADMIN' ? 'USER' : 'ADMIN')} 
                className={`px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all btn-active flex items-center gap-2 ${viewMode === 'ADMIN' ? 'bg-slate-100 text-slate-600' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/10'}`}
              >
                {viewMode === 'ADMIN' ? <Users className="w-3 h-3" /> : <Settings className="w-3 h-3" />}
                <span className="hidden md:inline">{viewMode === 'ADMIN' ? 'Registre' : 'Espace Entreprise'}</span>
              </button>
            )}

            {user && (
              <button 
                onClick={handleSignOut} 
                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl bg-red-50 text-red-500 border border-red-100 btn-active transition-all" 
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>
    )
  ), [viewMode, switchView, user, profile]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Initialisation Node...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPortal />;
  }

  if (showGreeting && profile) {
    return <GreetingAnimation member={{ name: profile.name || profile.email, phone: '' }} onComplete={handleGreetingComplete} />;
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-100 bg-[#f8fafc]">
      {header}

      <main className={`flex-1 relative transition-all duration-500 ${transitioning ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
        {viewMode === 'USER' && (
          <MemoizedUserDocGrid 
            documents={documents} 
            onOpenDoc={onOpenDocRequest} 
            isAdmin={profile?.role === 'COMPANY_OWNER'} 
            onDeleteDoc={setDocToDelete} 
            onImportDocuments={() => {}} 
          />
        )}
        {viewMode === 'ADMIN' && profile?.role === 'COMPANY_OWNER' && (
          <MemoizedAdminPanel 
            documents={documents} 
            onAddDocument={addDocument} 
            onImportDocuments={() => {}} 
            onUpdateCode={updateDocCode} 
            onToggleStatus={toggleDocStatus} 
            onDeleteDocument={setDocToDelete} 
          />
        )}
        {viewMode === 'VIEWER' && activeDoc && (
          <SecureViewer 
            document={activeDoc} 
            onExit={() => switchView('USER')} 
            isAdmin={profile?.role === 'COMPANY_OWNER'} 
            onDelete={() => setDocToDelete(activeDoc.id)} 
          />
        )}
      </main>
      
      {isSubscriptionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl border border-white/20 animate-modal-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><CreditCard className="w-8 h-8" /></div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Gestion d'Abonnement</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Scale your security node</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="p-6 rounded-3xl border-2 border-indigo-600 bg-indigo-50/30">
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Premium</span>
                <div className="text-3xl font-black text-slate-900 mt-2">49€<span className="text-sm font-bold text-slate-400">/mois</span></div>
                <ul className="mt-4 space-y-2">
                  <li className="text-[10px] font-bold text-slate-600 flex items-center gap-2"><div className="w-1 h-1 bg-indigo-600 rounded-full"></div> Documents Illimités</li>
                  <li className="text-[10px] font-bold text-slate-600 flex items-center gap-2"><div className="w-1 h-1 bg-indigo-600 rounded-full"></div> Partenaires Illimités</li>
                </ul>
                <button className="w-full mt-6 bg-indigo-600 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest">Actif</button>
              </div>
              
              <div className="p-6 rounded-3xl border border-slate-100 bg-slate-50 opacity-60">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Entreprise</span>
                <div className="text-3xl font-black text-slate-900 mt-2">Sur Devis</div>
                <ul className="mt-4 space-y-2">
                  <li className="text-[10px] font-bold text-slate-600 flex items-center gap-2"><div className="w-1 h-1 bg-slate-400 rounded-full"></div> Multi-Teams</li>
                  <li className="text-[10px] font-bold text-slate-600 flex items-center gap-2"><div className="w-1 h-1 bg-slate-400 rounded-full"></div> API Access</li>
                </ul>
                <button disabled className="w-full mt-6 bg-slate-200 text-slate-400 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest">Bientôt</button>
              </div>
            </div>

            <button onClick={() => setIsSubscriptionModalOpen(false)} className="w-full text-slate-400 font-bold py-2 text-[9px] uppercase tracking-widest">Retour au console</button>
          </div>
        </div>
      )}

      {docToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          {/* Fix: Corrected typo 'max-sm' to 'max-w-sm' */}
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl border border-red-100 text-center animate-modal-in">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce"><i className="fas fa-radiation text-2xl"></i></div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Détruire Package ?</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-3 mb-8 leading-relaxed">Cette opération est définitive.</p>
            <div className="flex flex-col gap-3">
              <button onClick={executeDelete} className="w-full bg-red-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-600/20 btn-active">Confirmer</button>
              <button onClick={() => setDocToDelete(null)} className="w-full bg-slate-100 text-slate-500 font-bold py-3 rounded-2xl text-[9px] uppercase tracking-widest">Annuler</button>
            </div>
          </div>
        </div>
      )}

      <footer className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 bg-white/80 border border-white/50 px-6 md:px-10 py-3 md:py-4 rounded-full flex items-center gap-6 md:gap-12 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 z-[40] shadow-2xl backdrop-blur-2xl whitespace-nowrap overflow-hidden max-w-[90vw]">
        <div className="flex items-center gap-2 md:gap-3"><div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div> <span className="hidden xs:inline">Cloud Node Active</span><span className="xs:hidden">Live</span></div>
        <div className="w-[1px] h-3 bg-slate-200"></div>
        <div className="flex items-center gap-2 md:gap-3"><i className="fas fa-satellite-dish text-indigo-400"></i> Firebase</div>
        <div className="w-[1px] h-3 bg-slate-200"></div>
        <div className="text-indigo-600 flex items-center gap-2 md:gap-3">< ShieldCheck className="w-3 h-3 text-indigo-400" /> <span className="hidden xs:inline">Encrypted Cloud</span><span className="xs:hidden">SSL</span></div>
      </footer>
    </div>
  );
};

export default App;
