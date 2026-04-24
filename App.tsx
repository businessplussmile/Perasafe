
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { SecureDocument, ViewMode, UserProfile, SecurityAlert } from './types';
import { PARTNER_LIMITS, DOC_LIMITS, STORAGE_LIMITS } from './constants';
import AdminPanel from './components/AdminPanel';
import UserDocGrid from './components/UserDocGrid';
import SecureViewer from './components/SecureViewer';
import LoginPortal from './components/LoginPortal';
import OnboardingFlow from './components/OnboardingFlow';
import SubscriptionSuccessAnimation from './components/SubscriptionSuccessAnimation';
import SuperAdminPanel from './components/SuperAdminPanel';
import LandingPage from './components/LandingPage';
import ProductTour from './components/ProductTour';
import ProtocolPage from './components/ProtocolPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import NotificationBell from './components/NotificationBell';
import HelpAssistant from './components/HelpAssistant';
import { encryptContent, decryptContent, summarizeDocument, extractKeywords } from './services/documentService';
import { useAuth } from './hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';

const HighlightOverlay = () => {
    const [target, setTarget] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleHighlight = (e: any) => {
            const id = e.detail.id;
            const element = document.getElementById(id);
            if (element) {
                // Scroll first to ensure visibility
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Wait for scroll to stabilize before measuring
                setTimeout(() => {
                    const rect = element.getBoundingClientRect();
                    const scrollY = window.scrollY || window.pageYOffset;
                    const scrollX = window.scrollX || window.pageXOffset;
                    
                    setTarget({
                        top: rect.top + scrollY,
                        left: rect.left + scrollX,
                        width: rect.width,
                        height: rect.height
                    });
                    setIsVisible(true);
                    
                    // Auto-hide after 5 seconds
                    setTimeout(() => setIsVisible(false), 5000);
                }, 600);
            }
        };
        window.addEventListener('perasafe:highlight', handleHighlight as EventListener);
        return () => window.removeEventListener('perasafe:highlight', handleHighlight as EventListener);
    }, []);

    if (!isVisible || !target) return null;

    return (
        <AnimatePresence>
          {isVisible && (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="absolute z-[9999] pointer-events-none"
                style={{
                    top: target.top - 10,
                    left: target.left - 10,
                    width: target.width + 20,
                    height: target.height + 20,
                    border: '4px solid #4f46e5',
                    borderRadius: '16px',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.5), 0 0 40px rgba(79,70,229,0.9)',
                }}
            >
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-2xl whitespace-nowrap">
                Action Identifiée
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    );
};
import { db, signOut } from './services/firebaseService';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, setDoc, addDoc, serverTimestamp, getDoc, collectionGroup } from 'firebase/firestore';
import { LogOut, ShieldCheck, Settings, Users, PieChart, CreditCard, ChevronRight, Bell, Search, Plus, CheckCircle2, Ban } from 'lucide-react';

const LIFESPAN_MS = 24 * 60 * 60 * 1000; // 24 heures

// Composants mémoïsés pour éviter les re-rendus inutiles de toute l'application
const MemoizedUserDocGrid = React.memo(UserDocGrid);
const MemoizedAdminPanel = React.memo(AdminPanel);

const App: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [showSubscriptionSuccess, setShowSubscriptionSuccess] = useState(false);
  const [justOnboardedCompany, setJustOnboardedCompany] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('LANDING');
  const [ownedDocs, setOwnedDocs] = useState<SecureDocument[]>([]);
  const [invitedDocs, setInvitedDocs] = useState<SecureDocument[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [activeDoc, setActiveDoc] = useState<SecureDocument | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [appNotification, setAppNotification] = useState<{
    title: string;
    message: string;
    solution?: string;
    actionBtn?: string;
    onAction?: () => void;
  } | null>(null);

  const notifyEvent = useCallback((title: string, message: string, solution?: string, actionBtn?: string, onAction?: () => void) => {
    setAppNotification({ title, message, solution, actionBtn, onAction });
  }, []);

  const documents = useMemo(() => {
    const combined = [...ownedDocs, ...invitedDocs];
    const unique = Array.from(new Map(combined.map(d => [d.id, d])).values());
    return unique.sort((a, b) => b.createdAt - a.createdAt);
  }, [ownedDocs, invitedDocs]);

  // Écran de compte bloqué
  if (profile?.isBlocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
        <div className="bg-white rounded-[3rem] p-12 max-w-md shadow-2xl animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-pulse">
            <Ban className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">Compte Suspendu</h1>
          <p className="text-slate-500 text-xs font-medium leading-relaxed mb-8 uppercase tracking-widest">
            Votre accès à la plateforme a été suspendu par un administrateur. 
            Veuillez contacter le support pour plus d'informations.
          </p>
          <button 
            onClick={() => signOut()}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
          >
            Déconnexion
          </button>
        </div>
      </div>
    );
  }

  // Auto-redirect to login if partner link is used
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('import') === 'true' && !user) {
      setViewMode('LOGIN');
    }
  }, [user]);

  // Synchronisation avec Firestore et Auto-Routage
  useEffect(() => {
    if (user && profile) {
      // Ensure super admin is in the 'admins' collection for Firestore rules
      if (user.email === 'jorisahoussi4@gmail.com') {
        setDoc(doc(db, 'admins', user.uid), {
          email: user.email,
          role: 'SUPER_ADMIN',
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(err => console.error("Admin registry failed:", err));
      }

      // Redirect incomplete profiles to ONBOARDING
      if (!profile.onboardingCompleted && profile.role === 'COMPANY_OWNER' && viewMode !== 'ONBOARDING') {
        setViewMode('ONBOARDING');
        return;
      }
      
      // Auto-route to correct interface from public screens based on role
      if (viewMode === 'LANDING' || viewMode === 'LOGIN') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('import') === 'true') {
          setViewMode('USER');
        } else {
          if (profile.role === 'COMPANY_OWNER') {
            setViewMode('ADMIN');
          } else if (profile.role === 'ADMIN') {
            setViewMode('SUBSCRIPTION');
          } else {
            setViewMode('USER');
          }
        }
      }
    }
  }, [user, profile, viewMode]);

  useEffect(() => {
    if (!profile) {
      setOwnedDocs([]);
      setInvitedDocs([]);
      return;
    }

    let unsubOwned: () => void = () => {};
    let unsubInvited: () => void = () => {};

    if (profile.role === 'COMPANY_OWNER' || profile.role === 'ADMIN') {
      // Les entreprises voient leurs propres documents
      if (profile.companyId) {
        const qOwned = query(collection(db, 'companies', profile.companyId, 'documents'));
        unsubOwned = onSnapshot(qOwned, (snapshot) => {
          setOwnedDocs(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SecureDocument)));
        });
      }
      
      // Et les documents où ils sont invités
      const qInvited = query(collectionGroup(db, 'documents'), where('partnerIds', 'array-contains', profile.email.toLowerCase()));
      unsubInvited = onSnapshot(qInvited, (snapshot) => {
        setInvitedDocs(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SecureDocument)));
      });
    } else if (profile.role === 'PARTNER') {
      // Les partenaires voient uniquement les documents où ils sont listés
      const qInvited = query(collectionGroup(db, 'documents'), where('partnerIds', 'array-contains', profile.email.toLowerCase()));
      unsubInvited = onSnapshot(qInvited, (snapshot) => {
        setInvitedDocs(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SecureDocument)));
      });
    }

    const handleGlobalAgent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { command, targetName } = customEvent.detail;

      if (command === 'delete_document') {
        const target = targetName?.toLowerCase() || '';

        setOwnedDocs((currentOwnedDocs) => {
           if (currentOwnedDocs.length > 0) {
             let docToTarget = null;
             
             if (target) {
               // Recherche par substring, insensible à la casse sur le champ 'title'
               docToTarget = currentOwnedDocs.find(d => d.title?.toLowerCase().includes(target));
             }
             
             if (!docToTarget && !target) {
               // Comportement par défaut : le document le plus récent
               const sortedDocs = [...currentOwnedDocs].sort((a, b) => (b.createdAt as any) - (a.createdAt as any));
               docToTarget = sortedDocs[0];
             }

             if (docToTarget) {
               setDocToDelete(docToTarget.id);
               notifyEvent("Action Argentique", "Destruction Demandée", `L'Agent a ciblé le document "${docToTarget.title || 'Sans titre'}" pour destruction. Veuillez confirmer manuellement.`);
             } else {
               notifyEvent("Action Argentique", "Cible Introuvable", `L'Agent n'a pas pu identifier de document nommé "${target}" dans votre Registre.`);
             }
           } else {
             notifyEvent("Action Argentique", "Erreur d'Exécution", "L'Agent n'a trouvé aucun document à détruire dans votre Registre.");
           }
           return currentOwnedDocs;
        });
      } else if (command === 'panic') {
        signOut();
      }
    };

    window.addEventListener('perasafe:agent_global', handleGlobalAgent);

    return () => {
      unsubOwned();
      unsubInvited();
      window.removeEventListener('perasafe:agent_global', handleGlobalAgent);
    };
  }, [profile]);

  // Vérification périodique optimisée de l'expiration
  useEffect(() => {
    const checkExpiration = async () => {
      if (!profile || profile.role !== 'COMPANY_OWNER') return;

      const now = Date.now();
      for (const docItem of documents) {
        if (docItem.lifespanStart && !docItem.isConsumed) {
          const duration = docItem.validityDuration || LIFESPAN_MS;
          if (now - docItem.lifespanStart >= duration) {
            const docRef = doc(db, 'companies', profile.companyId!, 'documents', docItem.id);
            await updateDoc(docRef, { isConsumed: true });
          }
        }
      }
    };

    const timer = setInterval(checkExpiration, 10000); 
    return () => clearInterval(timer);
  }, [documents, profile]);

  useEffect(() => {
    if (!profile || profile.role !== 'COMPANY_OWNER' || !profile.companyId) {
      setSecurityAlerts([]);
      return;
    }

    const q = query(
      collection(db, 'companies', profile.companyId, 'securityAlerts')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SecurityAlert));
      setSecurityAlerts(alerts.sort((a, b) => b.timestamp - a.timestamp));
    });

    return () => unsubscribe();
  }, [profile]);

  const switchView = useCallback((mode: ViewMode, doc: SecureDocument | null = null) => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setActiveDoc(doc);
      setViewMode(mode);
      setTransitioning(false);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 100);
  }, [transitioning]);

  const handleSubscriptionSuccessComplete = useCallback(() => {
    setShowSubscriptionSuccess(false);
    setViewMode(profile?.role === 'COMPANY_OWNER' ? 'ADMIN' : 'USER');
  }, [profile?.role]);

  const addDocument = useCallback(async (docData: Omit<SecureDocument, 'id' | 'createdAt' | 'isConsumed' | 'companyId' | 'uploaderId'>) => {
    if (!profile || profile.role !== 'COMPANY_OWNER') return;

    // Vérification de l'abonnement (Nombre de documents)
    const tier = profile.subscriptionTier || 'FREE';
    const docLimit = DOC_LIMITS[tier];

    if (documents.length >= docLimit) {
      if (tier === 'FREE') {
        notifyEvent(
          "Quota de création atteint",
          `Vous avez atteint la limite de votre forfait ${tier} (${docLimit} document maximum).`,
          "Passez à un forfait supérieur pour ajouter plus de fichiers et bénéficier de fonctionnalités avancées.",
          "Voir les offres",
          () => switchView('SUBSCRIPTION')
        );
      } else {
        notifyEvent(
          "Limite de documents atteinte",
          `Votre forfait actuel vous limite à ${docLimit} document${docLimit > 1 ? 's' : ''}.`,
          "Améliorez votre infrastructure cloud en passant au niveau supérieur.",
          "Améliorer l'offre",
          () => switchView('SUBSCRIPTION')
        );
      }
      return;
    }

    const encryptedContent = encryptContent(docData.content, docData.accessCode);
    const newDocSize = encryptedContent.length;
    const currentUsage = documents.reduce((sum, doc) => sum + (doc.content?.length || 0), 0);
    const storLimit = STORAGE_LIMITS[tier];

    if (currentUsage + newDocSize > storLimit) {
      notifyEvent(
        "Stockage insuffisant",
        `L'espace restant est insuffisant pour finaliser le chiffrement (Volume actuel : ${storLimit / (1024*1024)} Mo max).`,
        "Supprimez vos anciens documents pour libérer de l'espace ou souscrivez à une offre PRO/BUSINESS.",
        "Gérer l'espace",
        () => switchView('SUBSCRIPTION')
      );
      return;
    }

    const newDocRef = doc(collection(db, 'companies', profile.companyId!, 'documents'));
    const companyName = profile.onboardingData?.companyName || `Espace de ${profile.name || profile.email}`;
    
    await setDoc(newDocRef, {
      ...docData,
      id: newDocRef.id,
      content: encryptedContent,
      createdAt: Date.now(),
      isConsumed: false,
      companyId: profile.companyId,
      uploaderId: profile.uid,
      companyName: companyName,
      partnerIds: docData.partnerIds || [],
      summary: docData.summary || '',
      keywords: extractKeywords(docData.content)
    });
  }, [profile, documents]);

  const onOpenDocRequest = useCallback(async (document: SecureDocument, code: string) => {
    if (!profile) return;
    
    // Sécurité supplémentaire : vérifier si l'utilisateur est autorisé
    const isOwner = profile.role === 'COMPANY_OWNER' && profile.companyId === document.companyId;
    const isPartner = document.partnerIds.some(email => email.toLowerCase() === profile.email.toLowerCase());
    const isSuperAdmin = profile.role === 'ADMIN';

    if (!isOwner && !isPartner && !isSuperAdmin) {
      notifyEvent(
        "Accès Réfusé",
        "Votre identité numérique n'est pas associée à ce package de données chiffrées.",
        "Demandez à l'administrateur ou au propriétaire de l'entreprise de vous ajouter comme partenaire sur ce document."
      );
      return;
    }

    const now = Date.now();
    
    const duration = document.validityDuration || LIFESPAN_MS;
    
    // Si l'utilisateur n'est NI le propriétaire NI le super admin, on applique les restrictions d'expiration
    if (!isOwner && !isSuperAdmin && (document.isConsumed || (document.lifespanStart && now - document.lifespanStart >= duration))) {
      notifyEvent(
        "Cycle de vie terminé",
        "Ce document a expiré et n'est plus accessible selon les paramètres de sécurité définis.",
        "Contactez l'administrateur du document pour un nouvel accès ou un nouveau lien sécurisé."
      );
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
    if (!document || !document.companyId) return false;

    // Strict ownership check
    if (document.companyId !== profile.companyId) return false;

    const originalContent = decryptContent(document.content, document.accessCode);
    if (originalContent.includes("ERREUR DE DÉCHIFFREMENT")) return false;

    const newEncryptedContent = encryptContent(originalContent, newCode);
    const docRef = doc(db, 'companies', document.companyId, 'documents', id);
    
    await updateDoc(docRef, { 
      accessCode: newCode,
      content: newEncryptedContent,
      isConsumed: false,
      lifespanStart: null,
      lastCodeUsedAtOpening: null
    });
    return true;
  }, [profile, documents]);

  const updateDocPartners = useCallback(async (id: string, newPartners: string[]) => {
    try {
      if (!profile || (profile.role !== 'COMPANY_OWNER' && profile.role !== 'ADMIN')) return;
      const document = documents.find(d => d.id === id);
      if (!document || !document.companyId) return;

      if (profile.role === 'COMPANY_OWNER' && document.companyId !== profile.companyId) return;

      const docRef = doc(db, 'companies', document.companyId, 'documents', id);
      await updateDoc(docRef, { partnerIds: newPartners });
    } catch (err) {
      console.error("App: updateDocPartners error:", err);
      throw err;
    }
  }, [profile, documents]);

  const toggleDocStatus = useCallback(async (id: string) => {
    if (!profile || profile.role !== 'COMPANY_OWNER') return;
    const document = documents.find(d => d.id === id);
    if (!document || !document.companyId) return;

    if (document.companyId !== profile.companyId) return;

    const docRef = doc(db, 'companies', document.companyId, 'documents', id);
    await updateDoc(docRef, { isConsumed: !document.isConsumed });
  }, [profile, documents]);

  const importDocuments = useCallback(async (docsToImport: SecureDocument[]) => {
    if (!profile || profile.role !== 'COMPANY_OWNER' || !profile.companyId) return;
    
    const tier = profile.subscriptionTier || 'FREE';
    const docLimit = DOC_LIMITS[tier];
    const availableSlots = docLimit - documents.length;

    if (availableSlots <= 0) {
      notifyEvent(
        "Capacité maximale atteinte",
        `Votre espace sécurisé ne peut contenir que ${docLimit} documents simultanément.`,
        "Passez à un abonnement supérieur pour accroître votre volume de stockage.",
        "Voir les offres",
        () => setIsSubscriptionModalOpen(true)
      );
      return;
    }

    const toProcess = docsToImport.slice(0, availableSlots);
    const companyName = profile.onboardingData?.companyName || `Espace de ${profile.name || profile.email}`;
    const batchPromises = toProcess.map(docData => {
      const newDocRef = doc(collection(db, 'companies', profile.companyId!, 'documents'));
      
      // Essayer d'extraire les mots-clés s'ils manquent (nécessite le déchiffrement temporaire)
      let keywords = docData.keywords;
      if (!keywords && docData.content && docData.accessCode) {
        try {
          const plain = decryptContent(docData.content, docData.accessCode);
          keywords = extractKeywords(plain);
        } catch (e) {
          console.warn("Keyword extraction failed during import", e);
        }
      }

      return setDoc(newDocRef, {
        ...docData,
        id: newDocRef.id,
        createdAt: Date.now(),
        isConsumed: false,
        companyId: profile.companyId,
        uploaderId: profile.uid,
        companyName: companyName,
        keywords: keywords || []
      });
    });

    await Promise.all(batchPromises);
    if (docsToImport.length > availableSlots) {
      notifyEvent(
        "Importation partielle",
        `Certains documents ont été bloqués car la limite de ${docLimit} documents a été atteinte.`,
        "Libérez de l'espace ou passez à une offre supérieure pour importer le reste de vos données sécurisées.",
        "Améliorer l'offre",
        () => setIsSubscriptionModalOpen(true)
      );
    }
  }, [profile, documents]);

  const executeDelete = useCallback(async () => {
    if (!docToDelete || !profile) return;
    
    const document = documents.find(d => d.id === docToDelete);
    if (!document) return;

    // Security check: only owner can delete
    if (document.companyId !== profile.companyId && profile.role !== 'ADMIN') {
      notifyEvent(
        "Opération non autorisée",
        "Vous ne disposez pas des privilèges administratifs requis pour détruire cette archive.",
        "Demandez au propriétaire initial (l'auteur du document) d'effectuer cette destruction."
      );
      return;
    }
    
    const docRef = doc(db, 'companies', document.companyId, 'documents', docToDelete);
    await deleteDoc(docRef);
    
    if (activeDoc?.id === docToDelete) switchView('USER');
    setDocToDelete(null);
  }, [docToDelete, activeDoc, switchView, profile, documents]);

  // Calcul du stockage utilisé
  const storageUsage = useMemo(() => {
    return documents.reduce((sum, doc) => sum + (doc.content?.length || 0), 0);
  }, [documents]);

  const storageLimit = useMemo(() => {
    if (!profile) return 0;
    return STORAGE_LIMITS[profile.subscriptionTier || 'STANDARD'];
  }, [profile]);

  const upgradeSubscription = useCallback(async (tier: 'PRO' | 'BUSINESS') => {
    if (!profile || profile.role !== 'COMPANY_OWNER') return;
    
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, { 
        subscriptionStatus: 'PENDING',
        requestedTier: tier
      });
      
      notifyEvent(
        "Demande d'évolution enregistrée",
        `Votre requête pour l'accès au niveau ${tier} a été transmise avec succès.`,
        "Notre équipe d'administration est en cours d'analyse de votre dossier. L'activation sera automatique."
      );
      setIsSubscriptionModalOpen(false);
    } catch (error) {
      console.error("Upgrade request error:", error);
      notifyEvent(
        "Erreur de communication",
        "Impossible de finaliser votre demande d'évolution vers nos serveurs.",
        "Veuillez vérifier votre connexion réseau et réessayer ultérieurement."
      );
    }
  }, [profile]);

  const handleTourComplete = useCallback(async (type: 'admin' | 'user') => {
    if (!profile) return;
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        [type === 'admin' ? 'hasSeenAdminTour' : 'hasSeenUserTour']: true
      });
    } catch (error) {
      console.error("Error updating tour status:", error);
    }
  }, [profile]);

  const handleSignOut = () => {
    signOut();
    switchView('USER');
  };

  const header = useMemo(() => (
    viewMode !== 'VIEWER' && (
      <header className="glass-light sticky top-0 z-50 px-3 md:px-12 py-3 md:py-5 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-1">
          <div className="flex items-center gap-2 md:gap-5 cursor-pointer btn-active transition-all shrink-0" onClick={() => switchView('USER')}>
            <div className="bg-indigo-600 p-2 md:p-3 rounded-xl md:rounded-2xl shadow-xl shadow-indigo-600/20">
              < ShieldCheck className="text-white w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg md:text-xl font-black tracking-tighter text-slate-900 uppercase block leading-none">PERASafe</span>
              <span className="text-[8px] md:text-[10px] text-indigo-600 font-bold tracking-[0.2em] md:tracking-[0.3em] uppercase opacity-70">Enterprise Cloud</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 shrink-0 overflow-x-auto scrollbar-hide py-1">
            {profile && (
              <div className="hidden lg:flex items-center gap-3 mr-4 px-4 py-2 bg-slate-100 rounded-full border border-slate-200/50 shrink-0">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest truncate max-w-[150px]">
                  {profile.email} ({profile.role})
                </span>
                {profile.role === 'COMPANY_OWNER' && (
                  <button 
                    id="tour-btn-stats"
                    onClick={() => setIsSubscriptionModalOpen(true)}
                    className={`ml-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${(profile.subscriptionTier === 'PRO' || profile.subscriptionTier === 'BUSINESS') ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}
                  >
                    {profile.subscriptionTier === 'PRO' ? 'PRO' : (profile.subscriptionTier === 'BUSINESS' ? 'BUSINESS' : (profile.subscriptionStatus === 'PENDING' ? 'ATTENTE VAL.' : (profile.subscriptionTier === 'FREE' ? 'GRATUIT' : 'STANDARD')))}
                  </button>
                )}
              </div>
            )}

            {profile?.role === 'ADMIN' && (
              <button 
                onClick={() => switchView(viewMode === 'SUBSCRIPTION' ? 'USER' : 'SUBSCRIPTION')} 
                className={`px-3 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all btn-active flex items-center gap-1.5 md:gap-2 shrink-0 ${viewMode === 'SUBSCRIPTION' ? 'bg-slate-100 text-slate-600' : 'bg-orange-500 text-white shadow-xl shadow-orange-500/10'}`}
              >
                {viewMode === 'SUBSCRIPTION' ? <Users className="w-3 h-3 md:w-3.5 md:h-3.5" /> : <ShieldCheck className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                <span className="hidden sm:inline">{viewMode === 'SUBSCRIPTION' ? 'Registre' : 'Console Super-Admin'}</span>
              </button>
            )}

            {profile?.role === 'COMPANY_OWNER' && (
              <button 
                id="tour-btn-nav-admin"
                onClick={() => switchView(viewMode === 'ADMIN' ? 'USER' : 'ADMIN')} 
                className={`px-3 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all btn-active flex items-center gap-1.5 md:gap-2 shrink-0 ${viewMode === 'ADMIN' ? 'bg-slate-100 text-slate-600' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/10'}`}
              >
                {viewMode === 'ADMIN' ? <Users id="tour-icon-registre" className="w-3 h-3 md:w-3.5 md:h-3.5" /> : <Settings id="tour-icon-admin" className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                <span className="hidden sm:inline">{viewMode === 'ADMIN' ? 'Registre' : 'Espace Entreprise'}</span>
              </button>
            )}

            {user && (
              <button 
                id="tour-btn-help"
                onClick={() => setIsHelpOpen(true)}
                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 btn-active transition-all shrink-0 hover:bg-indigo-100" 
                title="Besoin d'aide ?"
              >
                <div className="font-black font-mono text-lg">?</div>
              </button>
            )}

            {user && <NotificationBell profile={profile} alerts={securityAlerts} />}

            {user && (
              <button 
                id="tour-btn-logout"
                onClick={handleSignOut} 
                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl bg-red-50 text-red-500 border border-red-100 btn-active transition-all shrink-0" 
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            )}
          </div>
        </div>
      </header>
    )
  ), [viewMode, switchView, user, profile]);

  const isPublicView = ['LANDING', 'PROTOCOL', 'PRIVACY', 'LOGIN'].includes(viewMode);

  if (authLoading && !isPublicView) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Initialisation Node...</span>
        </div>
      </div>
    );
  }

  if (!user || (viewMode === 'ONBOARDING' && !profile)) {
    if (viewMode === 'PROTOCOL') {
      return (
        <ProtocolPage 
          onBack={() => setViewMode('LANDING')} 
          onSubscribe={() => setViewMode('LOGIN')} 
        />
      );
    }
    if (viewMode === 'PRIVACY') {
      return <PrivacyPolicy onBack={() => setViewMode('LANDING')} />;
    }
    if (viewMode === 'LOGIN' || viewMode === 'ONBOARDING') {
      return <LoginPortal onBack={() => setViewMode('LANDING')} />;
    }
    return (
      <LandingPage 
        onStart={() => setViewMode('LOGIN')} 
        onLogin={() => setViewMode('LOGIN')}
        onViewProtocol={() => setViewMode('PROTOCOL')}
        onViewPrivacy={() => setViewMode('PRIVACY')}
      />
    );
  }

  if (showSubscriptionSuccess && profile) {
    return <SubscriptionSuccessAnimation companyName={justOnboardedCompany || profile.name || profile.email} onComplete={handleSubscriptionSuccessComplete} />;
  }

  if (viewMode === 'ONBOARDING' && profile) {
    return <OnboardingFlow 
      profile={profile} 
      onComplete={(companyName) => {
        if (companyName) {
          setJustOnboardedCompany(companyName);
          setShowSubscriptionSuccess(true);
        } else {
          setViewMode(profile.role === 'COMPANY_OWNER' ? 'ADMIN' : 'USER');
        }
      }} 
      onReturnToLanding={async () => {
      try {
        await signOut();
        setViewMode('LANDING');
      } catch (e) {
        console.error(e);
      }
    }} />;
  }

  return (
    <div className="relative min-h-screen flex flex-col selection:bg-indigo-100 bg-[#f8fafc]">
      {header}
      <HighlightOverlay />
      
      {/* Product Tour Overlay */}
      {profile && (viewMode === 'ADMIN' || viewMode === 'USER') && (
        <ProductTour 
          role={profile.role === 'COMPANY_OWNER' ? 'COMPANY_OWNER' : 'PARTNER'} 
          userId={profile.uid} 
          viewMode={viewMode}
          hasSeenAdminTour={profile.hasSeenAdminTour}
          hasSeenUserTour={profile.hasSeenUserTour}
          onTourComplete={handleTourComplete}
        />
      )}

      <main className={`flex-1 relative transition-all duration-300 ${transitioning ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
        {viewMode === 'USER' && (
          <MemoizedUserDocGrid 
            documents={documents} 
            onOpenDoc={onOpenDocRequest} 
            isAdmin={profile?.role === 'COMPANY_OWNER'} 
            onDeleteDoc={setDocToDelete} 
            onImportDocuments={() => {}} 
            currentCompanyId={profile?.companyId}
            onNotifyEvent={notifyEvent}
          />
        )}
          {viewMode === 'ADMIN' && profile?.role === 'COMPANY_OWNER' && (
            <MemoizedAdminPanel 
              documents={ownedDocs} 
              profile={profile}
              storageUsage={storageUsage}
              storageLimit={storageLimit}
              onAddDocument={addDocument} 
              onImportDocuments={importDocuments} 
              onUpdateCode={updateDocCode} 
              onUpdatePartners={updateDocPartners}
              onUpgrade={() => setIsSubscriptionModalOpen(true)}
              onNotifyEvent={notifyEvent}
              onToggleStatus={toggleDocStatus} 
              onDeleteDocument={setDocToDelete} 
            />
          )}
          {viewMode === 'SUBSCRIPTION' && profile?.role === 'ADMIN' && (
            <SuperAdminPanel />
          )}
          {viewMode === 'PROTOCOL' && (
            <ProtocolPage 
              onBack={() => switchView('USER')} 
              onSubscribe={() => setIsSubscriptionModalOpen(true)} 
            />
          )}
          {viewMode === 'PRIVACY' && (
            <PrivacyPolicy 
              onBack={() => switchView('USER')} 
            />
          )}
          {viewMode === 'VIEWER' && activeDoc && (
          <SecureViewer 
            document={activeDoc} 
            readerProfile={profile}
            onExit={() => switchView('USER')} 
            isAdmin={profile?.role === 'COMPANY_OWNER' && activeDoc.companyId === profile.companyId} 
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Standard */}
              <div className={`p-5 rounded-[2rem] border-2 transition-all flex flex-col h-full ${profile?.subscriptionTier === 'STANDARD' ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-50 bg-slate-50 opacity-80'}`}>
                <div className="mb-4">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Initial</span>
                  <h4 className="text-lg font-black text-slate-900 tracking-tighter uppercase">Standard</h4>
                  <div className="text-xl font-black text-slate-800 mt-1">500<span className="text-[10px] text-slate-400 ml-1">FCFA/mois</span></div>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  <li className="text-[9px] font-bold text-slate-500 flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-indigo-500" /> {DOC_LIMITS.STANDARD} Document/mois</li>
                  <li className="text-[9px] font-bold text-slate-500 flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-indigo-500" /> {PARTNER_LIMITS.STANDARD} Partenaire/doc</li>
                  <li className="text-[9px] font-bold text-slate-500 flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-indigo-500" /> 2 MB Stockage</li>
                  <li className="text-[9px] font-bold text-slate-500 flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-indigo-500" /> Support Mail</li>
                </ul>
                <button disabled className="w-full bg-slate-200 text-slate-400 font-black py-3 rounded-2xl text-[9px] uppercase tracking-widest">
                  {profile?.subscriptionTier === 'STANDARD' ? 'Actuel' : 'Basique'}
                </button>
              </div>

              {/* Pro */}
              <div className={`p-5 rounded-[2rem] border-2 transition-all flex flex-col h-full ${profile?.subscriptionTier === 'PRO' ? 'border-indigo-600 bg-indigo-50/20' : (profile?.requestedTier === 'PRO' && profile?.subscriptionStatus === 'PENDING' ? 'border-orange-400 bg-orange-50/20' : 'border-slate-50 shadow-sm')}`}>
                <div className="mb-4">
                  <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">Populaire</span>
                  <h4 className="text-lg font-black text-slate-900 tracking-tighter uppercase">Pro</h4>
                  <div className="text-xl font-black text-slate-800 mt-1">2000<span className="text-[10px] text-slate-400 ml-1">FCFA/mois</span></div>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  <li className="text-[9px] font-bold text-slate-500 flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-indigo-500" /> 50 Documents/mois</li>
                  <li className="text-[9px] font-bold text-slate-500 flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-indigo-500" /> {PARTNER_LIMITS.PRO} Partenaires/doc</li>
                  <li className="text-[9px] font-bold text-slate-500 flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-indigo-500" /> 50 MB Stockage</li>
                  <li className="text-[9px] font-bold text-slate-500 flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-indigo-500" /> Images optimisées</li>
                  <li className="text-[9px] font-bold text-slate-500 flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-indigo-500" /> Assistance Automatisée</li>
                </ul>
                <button 
                  onClick={() => upgradeSubscription('PRO')}
                  disabled={profile?.subscriptionTier === 'PRO' || profile?.subscriptionStatus === 'PENDING'}
                  className="w-full bg-indigo-600 text-white font-black py-3 rounded-2xl text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {profile?.subscriptionTier === 'PRO' ? 'Actif' : (profile?.requestedTier === 'PRO' && profile?.subscriptionStatus === 'PENDING' ? 'En attente' : 'Choisir Pro')}
                </button>
              </div>

              {/* Business */}
              <div className={`p-5 rounded-[2rem] border-2 transition-all flex flex-col h-full ${profile?.subscriptionTier === 'BUSINESS' ? 'border-indigo-600 bg-indigo-50/20' : (profile?.requestedTier === 'BUSINESS' && profile?.subscriptionStatus === 'PENDING' ? 'border-orange-400 bg-orange-50/20' : 'border-slate-50 shadow-sm')}`}>
                <div className="mb-4">
                  <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">Élite</span>
                  <h4 className="text-lg font-black text-slate-900 tracking-tighter uppercase">Business</h4>
                  <div className="text-xl font-black text-slate-800 mt-1">5500<span className="text-[10px] text-slate-400 ml-1">FCFA/mois</span></div>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  <li className="text-[9px] font-bold text-slate-500 flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-indigo-500" /> 300 Documents/mois</li>
                  <li className="text-[9px] font-bold text-slate-500 flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-indigo-500" /> Partenaires illimités</li>
                  <li className="text-[9px] font-bold text-slate-500 flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-indigo-500" /> 500 MB Stockage</li>
                  <li className="text-[9px] font-bold text-slate-500 flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-indigo-500" /> Images (165 Ko max)</li>
                  <li className="text-[9px] font-bold text-slate-500 flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-indigo-500" /> Multi-utilisateurs</li>
                </ul>
                <button 
                  onClick={() => upgradeSubscription('BUSINESS')}
                  disabled={profile?.subscriptionTier === 'BUSINESS' || profile?.subscriptionStatus === 'PENDING'}
                  className="w-full bg-slate-900 text-white font-black py-3 rounded-2xl text-[9px] uppercase tracking-widest shadow-lg shadow-slate-900/20 disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {profile?.subscriptionTier === 'BUSINESS' ? 'Actif' : (profile?.requestedTier === 'BUSINESS' && profile?.subscriptionStatus === 'PENDING' ? 'En attente' : 'Choisir Biz')}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 mb-8">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center leading-relaxed">
                Le passage aux plans PRO ou BUSINESS nécessite une validation manuelle sécurisée par nos administrateurs.
              </p>
            </div>

            <button onClick={() => setIsSubscriptionModalOpen(false)} className="w-full text-slate-400 hover:text-indigo-600 font-bold py-2 text-[9px] uppercase tracking-widest transition-colors">Fermer la console</button>
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

      {/* Help Assistant */}
      {user && profile && (
        <HelpAssistant 
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          onNavigate={(view) => setViewMode(view as ViewMode)}
          onLogout={handleSignOut}
          userRole={profile.role}
          subscriptionTier={profile.subscriptionTier}
          documents={documents}
          storageUsage={storageUsage}
          storageLimit={storageLimit}
        />
      )}

      {/* Global Smart Notification */}
      {appNotification && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 relative animate-modal-in flex flex-col">
            <button 
              onClick={() => setAppNotification(null)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <i className="fas fa-exclamation-triangle text-2xl"></i>
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">{appNotification.title}</h3>
            <p className="text-sm font-medium text-slate-600 leading-relaxed mb-6">{appNotification.message}</p>
            
            {appNotification.solution && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-6">
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block mb-2">Solution recommandée</span>
                <p className="text-xs font-bold text-slate-700 leading-relaxed">{appNotification.solution}</p>
              </div>
            )}
            
            <div className="flex flex-col gap-3 mt-auto">
              {appNotification.actionBtn && appNotification.onAction && (
                <button 
                  onClick={() => {
                    appNotification.onAction!();
                    setAppNotification(null);
                  }} 
                  className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-[1.02] transition-all"
                >
                  {appNotification.actionBtn}
                </button>
              )}
              <button 
                onClick={() => setAppNotification(null)} 
                className="w-full bg-slate-100 text-slate-600 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Fermer
              </button>
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
