import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/firebaseService';
import { collection, query, onSnapshot, doc, updateDoc, setDoc, getDocs, deleteDoc, writeBatch, collectionGroup, orderBy, limit } from 'firebase/firestore';
import { UserProfile } from '../types';
import { CheckCircle, XCircle, Clock, User, Mail, Shield, Users as UsersIcon, Ban, Trash2, Calendar, RefreshCcw, AlertTriangle, FolderOpen, Download, ShieldCheck, Fingerprint } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const SignatureDisplay: React.FC<{ data: string, title?: string, name: string, isFormal?: boolean, roleContext?: string }> = ({ data, title, name, isFormal, roleContext }) => {
  const ref = React.useRef<any>(null);
  
  const isDataUrl = Boolean(data && typeof data === 'string' && data.startsWith('data:image'));
  
  useEffect(() => {
    if (data && ref.current && !isDataUrl) {
      setTimeout(() => {
        try {
          ref.current.fromData(JSON.parse(data));
          ref.current.off(); // make read-only
        } catch (e) {}
      }, 50);
    }
  }, [data, isDataUrl]);
  
  if (isFormal) {
    return (
      <div className="flex-1 font-sans">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">{title}</p>
        <div className="h-40 md:h-48 bg-white border border-slate-200 border-dashed rounded-xl relative flex items-center justify-center mb-4 overflow-hidden shadow-sm">
          {isDataUrl ? (
            <img src={data} alt="Signature" className="w-[120%] h-[120%] object-contain pointer-events-none mix-blend-darken relative z-10 scale-110 md:scale-125 origin-center" />
          ) : (
            <div className="relative z-10 w-full h-full scale-110 md:scale-125 flex items-center justify-center origin-center">
              <SignatureCanvas ref={ref} penColor="#0f172a" canvasProps={{ className: "w-full h-full pointer-events-none" }} />
            </div>
          )}
          <div className="absolute top-2 right-2 w-24 h-24 border-double border-4 border-indigo-600/20 rounded-full flex items-center justify-center transform rotate-[-15deg] pointer-events-none z-0">
            <div className="absolute inset-1 border border-indigo-600/10 rounded-full flex items-center justify-center">
              <div className="text-center p-2">
                <ShieldCheck className="w-6 h-6 text-indigo-600/20 mx-auto mb-0.5" />
                <span className="block text-[7px] font-black text-indigo-600/30 uppercase tracking-tighter leading-none">ARCHIVE SÉCURISÉE</span>
                <span className="block text-[9px] font-black text-indigo-600/40 uppercase leading-none mt-0.5">VALIDÉ</span>
                <span className="block text-[6px] font-bold text-indigo-600/20 uppercase mt-1">PERASafe Certification</span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <span className="block text-[10px] font-black uppercase text-indigo-600 tracking-wider mb-1">
             <Fingerprint className="w-3 h-3 inline-block -mt-0.5 mr-1" />
             {name}
          </span>
          <span className="block text-[8px] font-bold uppercase text-slate-400 tracking-widest">{roleContext}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] uppercase font-black text-slate-400 mb-2">{title}</span>
      <div className="w-48 h-32 bg-slate-50 border border-slate-200 border-dashed rounded-2xl relative overflow-hidden flex items-center justify-center">
        {isDataUrl ? (
          <img src={data} alt="Signature" className="w-[120%] h-[120%] object-contain pointer-events-none mix-blend-darken transform scale-125 origin-center" />
        ) : (
          <div className="w-full h-full scale-125 transform origin-center flex items-center justify-center">
            <SignatureCanvas ref={ref} penColor="#0f172a" canvasProps={{ className: "w-full h-full pointer-events-none" }} />
          </div>
        )}
      </div>
      <span className="text-xs font-black text-slate-800 uppercase mt-3">{name}</span>
    </div>
  );
};
import UserDocumentsModal from './UserDocumentsModal';

const resizeImage = (file: File): Promise<string> => {
   return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
         const img = new Image();
         img.onload = () => {
             const canvas = document.createElement('canvas');
             let width = img.width;
             let height = img.height;
             const MAX_DIMENSION = 800;

             if (width > height) {
                 if (width > MAX_DIMENSION) {
                     height = Math.round(height * (MAX_DIMENSION / width));
                     width = MAX_DIMENSION;
                 }
             } else {
                 if (height > MAX_DIMENSION) {
                     width = Math.round(width * (MAX_DIMENSION / height));
                     height = MAX_DIMENSION;
                 }
             }

             canvas.width = width;
             canvas.height = height;
             const ctx = canvas.getContext('2d');
             if (ctx) {
                 ctx.drawImage(img, 0, 0, width, height);
                 resolve(canvas.toDataURL('image/jpeg', 0.8));
             } else {
                 resolve(e.target?.result as string);
             }
         };
         img.onerror = () => reject(new Error('Image processing failed'));
         img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsDataURL(file);
   });
};

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  isDestructive?: boolean;
}

const SuperAdminPanel: React.FC = () => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [partnerCounts, setPartnerCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{message: string, type: 'success'|'error'} | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [systemSettings, setSystemSettings] = useState<any>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [selectedUserForDocs, setSelectedUserForDocs] = useState<UserProfile | null>(null);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [selectedAlertContext, setSelectedAlertContext] = useState<{alert: any, owner: UserProfile | undefined, reader: UserProfile} | null>(null);

  const showToast = (message: string, type: 'success'|'error' = 'success') => {
    setToastMessage({message, type});
    setTimeout(() => setToastMessage(null), 4000);
  };

  const closeConfirm = () => setConfirmDialog(prev => ({ ...prev, isOpen: false }));

  const requestConfirm = (props: Omit<ConfirmDialogState, 'isOpen'>) => {
    setConfirmDialog({ ...props, isOpen: true });
  };

  useEffect(() => {
    const q = query(collection(db, 'users'));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const usersList: UserProfile[] = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      } as UserProfile));
      
      setAllUsers(usersList);
      setLoading(false);

      // Async compute partner counts for companies
      const counts: Record<string, number> = {};
      for (const u of usersList) {
        if (u.role === 'COMPANY_OWNER' && u.companyId) {
          try {
            const docsQuery = collection(db, 'companies', u.companyId, 'documents');
            const docsSnapshot = await getDocs(docsQuery);
            const uniquePartners = new Set<string>();
            docsSnapshot.forEach(d => {
              const partnerIds = d.data().partnerIds || [];
              partnerIds.forEach((p: string) => uniquePartners.add(p));
            });
            counts[u.uid] = uniquePartners.size;
          } catch (e) {
            console.error("Failed to fetch documents for company", u.companyId, e);
            counts[u.uid] = 0;
          }
        }
      }
      setPartnerCounts(counts);
    });

    const settingsUnsubscribe = onSnapshot(doc(db, 'system', 'settings'), (docSnap) => {
      if (docSnap.exists()) {
        setSystemSettings(docSnap.data());
      }
    });

    const alertsQuery = query(
      collectionGroup(db, 'securityAlerts')
      // orderBy doesn't work currently on collectionGroups without index, we will sort in memory
    );
    const alertsUnsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      const alerts = snapshot.docs.map(d => ({ id: d.id, path: d.ref.path, ...d.data() }));
      alerts.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
      setSecurityAlerts(alerts);
    });

    return () => {
      unsubscribe();
      settingsUnsubscribe();
      alertsUnsubscribe();
    };
  }, []);

  const pendingUsers = useMemo(() => allUsers.filter(u => u.subscriptionStatus === 'PENDING'), [allUsers]);
  const activeUsers = useMemo(() => allUsers.filter(u => u.subscriptionStatus !== 'PENDING'), [allUsers]);

  const setExpirationDate = async (user: UserProfile, days: number) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const newExpiry = Date.now() + days * 24 * 60 * 60 * 1000;
      await updateDoc(userRef, { subscriptionExpiresAt: newExpiry });
      showToast(`Expiration mise à jour : +${days} jours.`);
    } catch (error) {
      console.error("Set expiry error:", error);
      showToast("Erreur lors de la mise à jour de l'expiration.", "error");
    }
  };

  const handleDecision = async (user: UserProfile, approved: boolean) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      
      if (approved) {
        const tier = user.requestedTier || 'STANDARD';
        await updateDoc(userRef, {
          subscriptionTier: tier,
          subscriptionStatus: 'ACTIVE',
          onboardingCompleted: true
        });
        
        if (user.companyId) {
          const companyRef = doc(db, 'companies', user.companyId);
          await updateDoc(companyRef, {
            subscriptionTier: tier
          });
        }
        showToast("Abonnement validé.");
      } else {
        await updateDoc(userRef, {
          subscriptionStatus: 'NONE',
          onboardingCompleted: false
        });
        showToast("Demande rejetée.");
      }
    } catch (error) {
      console.error("Decision error:", error);
      showToast("Erreur lors de la validation.", "error");
    }
  };

  const executeToggleBlock = async (user: UserProfile) => {
    const newStatus = !user.isBlocked;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { isBlocked: newStatus });
      showToast(`Utilisateur ${newStatus ? 'bloqué' : 'débloqué'}.`);
    } catch (error) {
      console.error("Block error:", error);
      showToast("Erreur lors de la modification du statut.", "error");
    }
    closeConfirm();
  };

  const toggleBlockUser = (user: UserProfile) => {
    const newStatus = !user.isBlocked;
    requestConfirm({
      title: `${newStatus ? 'Bloquer' : 'Débloquer'} l'utilisateur`,
      message: `Êtes-vous sûr de vouloir ${newStatus ? 'bloquer' : 'débloquer'} l'accès de ${user.email} ?`,
      isDestructive: newStatus,
      confirmText: newStatus ? 'Bloquer' : 'Débloquer',
      onConfirm: () => executeToggleBlock(user)
    });
  };

  const executeDeleteAccount = async (user: UserProfile) => {
    try {
      await deleteDoc(doc(db, 'users', user.uid));
      if (user.companyId) {
        await deleteDoc(doc(db, 'companies', user.companyId));
      }
      showToast("Compte supprimé définitivement.");
    } catch (error) {
      console.error("Delete account error:", error);
      showToast("Erreur lors de la suppression.", "error");
    }
    closeConfirm();
  };

  const deleteAccount = (user: UserProfile) => {
    requestConfirm({
      title: "Suppression Définitive",
      message: `ATTENTION: Voulez-vous SUPPRIMER DÉFINITIVEMENT le compte de ${user.email} ? Cette action est irréversible et supprimera toutes les ressources associées.`,
      isDestructive: true,
      confirmText: 'Supprimer Définitivement',
      onConfirm: () => executeDeleteAccount(user)
    });
  };

  const executePurge = async (user: UserProfile, olderThanDays: number) => {
    if (!user.companyId) return;
    setPurging(user.uid);
    try {
      const now = Date.now();
      const threshold = now - (olderThanDays * 24 * 60 * 60 * 1000);
      
      const docsQuery = collection(db, 'companies', user.companyId, 'documents');
      const snapshot = await getDocs(docsQuery);
      
      let count = 0;
      const batch = writeBatch(db);
      
      snapshot.forEach(d => {
        const data = d.data();
        if (data.createdAt < threshold) {
          batch.delete(d.ref);
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
        showToast(`${count} documents anciens supprimés.`);
      } else {
        showToast("Aucun document correspondant trouvé.");
      }
    } catch (error) {
      console.error("Purge error:", error);
      showToast("Erreur lors de la purge.", "error");
    } finally {
      setPurging(null);
      closeConfirm();
    }
  };

  const purgeDocuments = (user: UserProfile, olderThanDays: number) => {
    requestConfirm({
      title: "Purger les documents anciens",
      message: `Voulez-vous supprimer DÉFINITIVEMENT tous les documents de ${user.email} créés il y a plus de ${olderThanDays} jours ?`,
      isDestructive: true,
      confirmText: 'Purger',
      onConfirm: () => executePurge(user, olderThanDays)
    });
  };

  const executeFactoryReset = async () => {
    setPurging('ALL');
    try {
      const usersQuery = collection(db, 'users');
      const usersSnap = await getDocs(usersQuery);
      const batch = writeBatch(db);
      let opCount = 0;

      // Ensure we don't exceed Firestore 500 operation limit per batch,
      // but for this simple app, we can just use promises for documents to be safe and simple.
      const commitPromises = [];

      for (const u of usersSnap.docs) {
        if (u.data().email === 'jorisahoussi4@gmail.com') {
          continue; // Skip the super admin
        }

        const uid = u.id;
        const companyId = u.data().companyId;

        if (companyId) {
          // Fetch and delete documents in company
          const docsQuery = collection(db, 'companies', companyId, 'documents');
          const docsSnap = await getDocs(docsQuery);
          for (const d of docsSnap.docs) {
            commitPromises.push(deleteDoc(d.ref));
          }
          // Delete company
          commitPromises.push(deleteDoc(doc(db, 'companies', companyId)));
        }

        // Delete user
        commitPromises.push(deleteDoc(u.ref));
      }

      await Promise.all(commitPromises);
      showToast("Réinitialisation de la base de données réussie.");
    } catch (error) {
      console.error("Factory reset error:", error);
      showToast("Erreur lors de la réinitialisation.", "error");
    } finally {
      setPurging(null);
      closeConfirm();
    }
  };

  const factoryResetSystem = () => {
    requestConfirm({
      title: "RÉINITIALISATION D'URGENCE (FACTORY RESET)",
      message: `ATTENTION: Vous êtes sur le point d'effacer tous les utilisateurs, entreprises et documents de la base (sauf le super administrateur). C'EST IRRÉVERSIBLE. Tapez 'RESET' n'est pas requis, mais confirmez votre choix conscient.`,
      isDestructive: true,
      confirmText: 'EFFACER TOUT',
      onConfirm: () => executeFactoryReset()
    });
  };

  const updateSetting = async (keyPath: string, value: any) => {
    try {
      setSavingSettings(true);
      const settingsRef = doc(db, 'system', 'settings');
      let newData = { ...systemSettings };
      
      const parts = keyPath.split('.');
      if (parts.length === 2) {
        if (!newData[parts[0]]) newData[parts[0]] = {};
        newData[parts[0]][parts[1]] = value;
      } else {
        newData[keyPath] = value;
      }

      await updateDoc(settingsRef, newData).catch(err => {
         // Create if not exists
         if (err.code === 'not-found') {
            return setDoc(settingsRef, newData);
         }
         throw err;
      });
      showToast(`Paramètre mis à jour avec succès.`);
    } catch (error) {
       console.error("Update settings error:", error);
       showToast("Erreur lors de la mise à jour du paramètre.", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDownloadContract = async (ctx: { alert: any, owner: UserProfile | undefined, reader: UserProfile }) => {
    const element = document.getElementById('contract-to-print');
    if (!element) {
      showToast("Erreur: le contrat n'est pas affiché", "error");
      return;
    }
    
    try {
      showToast("Génération du PDF en cours...");
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; 
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add extra pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const safeName = (ctx.reader.name || ctx.reader.email || 'FRAUDEUR').replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`CONTRAT_CONFIDENTIALITE_${safeName}.pdf`);
      showToast("Contrat téléchargé avec succès !");
    } catch (e) {
      console.error("PDF Export failed", e);
      showToast("Erreur lors de l'export PDF", "error");
    }
  };

  const handleDeleteAlert = async (alertPath: string) => {
    try {
       await deleteDoc(doc(db, alertPath));
       showToast("Alerte supprimée avec succès.");
    } catch (error) {
       console.error("Delete alert error:", error);
       showToast("Erreur lors de la suppression de l'alerte.", "error");
    }
    closeConfirm();
  };

  const handleDeleteAllAlerts = async () => {
    try {
      setPurging('alerts');
      const batch = writeBatch(db);
      for (const alert of securityAlerts) {
        batch.delete(doc(db, alert.path));
      }
      await batch.commit();
      showToast("Toutes les alertes ont été supprimées.");
    } catch (error) {
      console.error("Delete all alerts error:", error);
      showToast("Erreur lors de la suppression des alertes.", "error");
    } finally {
      setPurging(null);
      closeConfirm();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto animate-fade-in relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-fade-in ${toastMessage.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'}`}>
          {toastMessage.type === 'error' ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5 text-green-400" />}
          <span className="text-xs font-bold">{toastMessage.message}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
            <div className={`w-16 h-16 ${confirmDialog.isDestructive ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
              {confirmDialog.isDestructive ? <AlertTriangle className="w-8 h-8" /> : <Shield className="w-8 h-8" />}
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{confirmDialog.title}</h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex gap-4">
              <button 
                onClick={closeConfirm}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={confirmDialog.onConfirm}
                className={`flex-1 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors text-white shadow-lg ${confirmDialog.isDestructive ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'}`}
              >
                {confirmDialog.confirmText || 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Console Super-Admin</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Gestion des abonnements stratégiques</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Pending Requests */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
              <Clock className="w-4 h-4 text-orange-500" /> Demandes en attente ({pendingUsers.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Utilisateur</th>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Plan Demandé</th>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pendingUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                        <CheckCircle className="w-12 h-12" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Toutes les demandes ont été traitées</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pendingUsers.map(u => (
                    <tr key={u.uid} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                            <User className="w-5 h-5" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-900">{u.name || u.email.split('@')[0]}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] font-medium text-slate-500">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-2">
                          <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase self-start">{u.requestedTier || 'STANDARD'}</span>
                          {u.onboardingData && (
                            <div className="flex flex-col gap-1 mt-2">
                              <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1"><i className="fas fa-building text-[8px] text-slate-400"></i> {u.onboardingData.companyName}</span>
                              {u.onboardingData.jobTitle && <span className="text-[10px] text-slate-500 font-bold">{u.onboardingData.jobTitle}</span>}
                              <span className="text-[10px] text-slate-500">{u.onboardingData.sector}</span>
                              <span className="text-[10px] text-slate-500">{u.onboardingData.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-3">
                          <button 
                            onClick={() => handleDecision(u, false)}
                            className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                            title="Rejeter"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDecision(u, true)}
                            className="w-10 h-10 flex items-center justify-center bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
                            title="Approuver"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Accounts Directory */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden mt-8">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center text-center xs:text-left flex-wrap gap-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
              <UsersIcon className="w-4 h-4 text-indigo-500" /> Annuaire des Comptes Actifs ({activeUsers.length})
            </h2>
            <button 
              onClick={factoryResetSystem}
              disabled={purging === 'ALL'}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-red-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" /> 
              {purging === 'ALL' ? "PURGE EN COURS..." : "RÉINITIALISER TOUT LE SYSTÈME"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">Utilisateur</th>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Type / Forfait</th>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Échéance</th>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Stats</th>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Contrôle Tactique</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activeUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                        <UsersIcon className="w-12 h-12" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Aucun utilisateur actif</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  activeUsers.map(u => (
                    <tr key={u.uid} className={`hover:bg-slate-50 transition-colors group ${u.isBlocked ? 'opacity-60 grayscale' : ''}`}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${u.role === 'ADMIN' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                            {u.role === 'ADMIN' ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
                            {u.isBlocked && (
                               <div className="absolute -top-1 -right-1 bg-red-600 border-2 border-white w-4 h-4 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                 <Ban className="w-2.5 h-2.5 text-white" />
                               </div>
                            )}
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-slate-900 truncate">{u.name || u.email.split('@')[0]}</span>
                              {u.isBlocked && <span className="bg-red-50 text-red-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">BLOQUÉ</span>}
                            </div>
                            <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1 mt-0.5 truncate"><Mail className="w-3 h-3" /> {u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-2">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase self-start ${u.role === 'ADMIN' ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                            {u.role}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase self-start ${(u.subscriptionTier === 'PRO' || u.subscriptionTier === 'BUSINESS') ? 'bg-indigo-50 text-indigo-600' : 'bg-green-50 text-green-600'}`}>
                            {u.subscriptionTier || 'STANDARD'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                            {u.subscriptionExpiresAt ? new Date(u.subscriptionExpiresAt).toLocaleDateString('fr-FR') : 'Non définie'}
                          </span>
                          <div className="flex gap-1 mt-1">
                             <button onClick={() => setExpirationDate(u, 10)} className="text-[8px] font-black text-indigo-600 uppercase border border-indigo-100 px-1.5 py-0.5 rounded-md hover:bg-indigo-50">+10j</button>
                             <button onClick={() => setExpirationDate(u, 30)} className="text-[8px] font-black text-indigo-600 uppercase border border-indigo-100 px-1.5 py-0.5 rounded-md hover:bg-indigo-50">+30j</button>
                             <button onClick={() => setExpirationDate(u, -1)} className="text-[8px] font-black text-red-600 uppercase border border-red-100 px-1.5 py-0.5 rounded-md hover:bg-red-50">Expirer</button>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 bg-slate-100 text-slate-700 font-black text-xs rounded-xl">
                            {partnerCounts[u.uid] !== undefined ? partnerCounts[u.uid] : '-'}
                          </div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Partenaires</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {/* Purge Controls */}
                          {u.role === 'COMPANY_OWNER' && (
                            <div className="flex flex-col gap-1 items-end mr-4 pr-4 border-r border-slate-100">
                               <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                                 <Calendar className="w-2.5 h-2.5" /> Purger Documents
                               </span>
                               <div className="flex gap-1">
                                 <button 
                                   onClick={() => purgeDocuments(u, 30)}
                                   disabled={purging === u.uid}
                                   className="px-2 py-1 rounded-lg bg-orange-50 text-orange-600 text-[8px] font-black border border-orange-100 hover:bg-orange-100 transition-all disabled:opacity-50"
                                   title="Plus de 30 jours"
                                 >
                                   +30j
                                 </button>
                                 <button 
                                   onClick={() => purgeDocuments(u, 90)}
                                   disabled={purging === u.uid}
                                   className="px-2 py-1 rounded-lg bg-orange-50 text-orange-600 text-[8px] font-black border border-orange-100 hover:bg-orange-100 transition-all disabled:opacity-50"
                                   title="Plus de 90 jours"
                                 >
                                   +90j
                                 </button>
                               </div>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <button 
                              onClick={() => setSelectedUserForDocs(u)}
                              className="w-9 h-9 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                              title="Gérer les documents"
                            >
                              <FolderOpen className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => toggleBlockUser(u)}
                              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${u.isBlocked ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600'}`}
                              title={u.isBlocked ? "Débloquer" : "Bloquer l'accès"}
                            >
                              {u.isBlocked ? <RefreshCcw className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                            </button>
                            <button 
                              onClick={() => deleteAccount(u)}
                              className="w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm transition-all"
                              title="Déclic de suppression totale"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Security Alerts */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden mt-8">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center text-center flex-wrap gap-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-red-500" /> Alertes de Sécurité Globales ({securityAlerts.length})
            </h2>
            {securityAlerts.length > 0 && (
              <button 
                onClick={() => requestConfirm({
                  title: 'Supprimer toutes les alertes ?',
                  message: 'Cette action supprimera définitivement toutes les alertes de sécurité globales et leurs preuves associées. Êtes-vous sûr ?',
                  onConfirm: handleDeleteAllAlerts
                })}
                disabled={purging === 'alerts'}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
              >
                {purging === 'alerts' ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Purger Tout
              </button>
            )}
          </div>
          
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left border-collapse relative">
              <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
                <tr>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Alerte</th>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Document</th>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Utilisateur (Fraudeur)</th>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {securityAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                        <Shield className="w-12 h-12" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Aucune alerte de sécurité</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  securityAlerts.map(alert => {
                    const owner = allUsers.find(u => u.uid === alert.ownerId);
                    const reader = allUsers.find(u => u.uid === alert.readerUid || u.email === alert.readerEmail);
                    return (
                    <tr key={alert.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-4 text-[10px] font-medium text-slate-500 whitespace-nowrap">
                        {alert.timestamp ? new Date(alert.timestamp).toLocaleString('fr-FR') : '-'}
                      </td>
                      <td className="px-8 py-4">
                        <span className="px-2 py-1 bg-red-50 text-red-600 rounded text-[9px] font-black uppercase inline-flex items-center gap-1 w-max">
                           <AlertTriangle className="w-3 h-3" /> {
                             alert.type === 'SCREENSHOT_ATTEMPT' ? "TENTATIVE DE CAPTURE D'ÉCRAN" :
                             alert.type === 'PHONE_DETECTED' ? "TÉLÉPHONE/CAMÉRA DÉTECTÉE" :
                             alert.type === 'BLUR_LOSS' ? "PERTE DE FOCUS (ENREGISTREUR EXTERNE POSSIBLE)" :
                             alert.type === 'CLIPBOARD_COPY' ? "COPIE PRESSE-PAPIER" :
                             alert.type === 'AUDIO_SCREENSHOT_DETECTED' ? "BRUIT DE CAPTURE D'ÉCRAN DÉTECTÉ" :
                             alert.type
                           }
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <span className="text-[11px] font-bold text-slate-900 line-clamp-1">{alert.documentTitle || alert.documentId}</span>
                        <div className="mt-1">
                          <span className="text-[10px] font-bold text-slate-700 block">
                            Propriétaire: {owner?.name || owner?.onboardingData?.companyName || alert.ownerId}
                          </span>
                          {(owner?.onboardingData?.phone || owner?.email) && (
                            <span className="text-[9px] text-slate-400 block">
                              {owner?.onboardingData?.phone ? `Tél: ${owner.onboardingData.phone}` : `Email: ${owner?.email}`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <button 
                          onClick={() => reader && setSelectedAlertContext({ alert, owner, reader })}
                          className="flex items-center gap-2 hover:bg-red-50 p-2 rounded transition-colors text-left"
                        >
                           <User className="w-4 h-4 text-red-500" />
                           <div>
                             <span className="text-[11px] font-bold text-red-600 block underline decoration-red-200 underline-offset-2">
                               {reader?.name || reader?.onboardingData?.companyName || alert.readerEmail || 'Utilisateur inconnu'}
                             </span>
                             {reader?.email && <span className="text-[9px] text-red-400 block">{reader.email}</span>}
                             {reader?.onboardingData?.phone && <span className="text-[9px] text-red-400 font-bold block">Tél: {reader.onboardingData.phone}</span>}
                           </div>
                        </button>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <button 
                          onClick={() => requestConfirm({
                            title: 'Supprimer l\'alerte ?',
                            message: 'Cette action supprimera cette alerte de sécurité. Êtes-vous sûr ?',
                            onConfirm: () => handleDeleteAlert(alert.path)
                          })}
                          className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors"
                          title="Supprimer l'alerte"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )})
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Configurations */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden mt-8">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center text-center flex-wrap gap-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
              <Shield className="w-4 h-4 text-indigo-500" /> Configuration du site (Landing Page)
            </h2>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
               <h3 className="text-xs font-black uppercase tracking-widest mb-4">Bloc Blanc (Architecture)</h3>
               <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Image URL</label>
                    <input 
                      type="text" 
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                      value={systemSettings?.landingImages?.whiteBlockUrl || ''} 
                      onChange={(e) => updateSetting('landingImages.whiteBlockUrl', e.target.value)} 
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 pb-2">Ou envoyer un fichier (max 1Mo)</label>
                     <input 
                        type="file" 
                        accept="image/*"
                        className="text-xs w-full"
                        onChange={async (e) => {
                           const file = e.target.files?.[0];
                           if (!file) return;
                           try {
                              const resizedUrl = await resizeImage(file);
                              updateSetting('landingImages.whiteBlockUrl', resizedUrl);
                           } catch (err) {
                              showToast("Erreur de traitement d'image", "error");
                           }
                        }}
                     />
                  </div>
                  {systemSettings?.landingImages?.whiteBlockUrl && (
                     <div className="mt-4 border border-slate-200 rounded-lg p-2 bg-white">
                        <img src={systemSettings.landingImages.whiteBlockUrl} alt="Preview White" className="h-20 object-contain" />
                        <button onClick={() => updateSetting('landingImages.whiteBlockUrl', '')} className="text-[10px] text-red-500 mt-2 hover:underline">Supprimer</button>
                     </div>
                  )}
               </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-white">
               <h3 className="text-xs font-black uppercase tracking-widest mb-4">Bloc Noir (Architecture)</h3>
               <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Image URL</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                      value={systemSettings?.landingImages?.blackBlockUrl || ''} 
                      onChange={(e) => updateSetting('landingImages.blackBlockUrl', e.target.value)} 
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 pb-2">Ou envoyer un fichier (max 1Mo)</label>
                     <input 
                        type="file" 
                        accept="image/*"
                        className="text-xs w-full"
                        onChange={async (e) => {
                           const file = e.target.files?.[0];
                           if (!file) return;
                           try {
                              const resizedUrl = await resizeImage(file);
                              updateSetting('landingImages.blackBlockUrl', resizedUrl);
                           } catch (err) {
                              showToast("Erreur de traitement d'image", "error");
                           }
                        }}
                     />
                  </div>
                  {systemSettings?.landingImages?.blackBlockUrl && (
                     <div className="mt-4 border border-slate-700 rounded-lg p-2 bg-slate-800">
                        <img src={systemSettings.landingImages.blackBlockUrl} alt="Preview Black" className="h-20 object-contain" />
                        <button onClick={() => updateSetting('landingImages.blackBlockUrl', '')} className="text-[10px] text-red-400 mt-2 hover:underline">Supprimer</button>
                     </div>
                  )}
               </div>
            </div>
          </div>
        </div>

      </div>

      {selectedUserForDocs && (
        <UserDocumentsModal 
          user={selectedUserForDocs} 
          onClose={() => setSelectedUserForDocs(null)} 
          showToast={showToast} 
        />
      )}

      {selectedAlertContext && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl sticky top-0 z-10">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" /> Profil Fraudeur
              </h2>
              <button 
                onClick={() => setSelectedAlertContext(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
               >
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
                <div className="flex items-center gap-3 mb-6 border-b border-red-200 pb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-red-700 uppercase tracking-widest">Plainte Formelle & Constat de Violation</h3>
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Secret des Affaires & Propriété Intellectuelle</p>
                  </div>
                </div>

                <div className="text-[11px] text-red-900 leading-relaxed text-justify mb-6 space-y-3 font-medium">
                  <p>
                    Il a été formellement détecté et horodaté par les systèmes de sécurité cryptographique de la plateforme <strong>PERASafe International</strong> une violation manifeste et intentionnelle de la Convention Générale de Confidentialité.
                  </p>
                  <p>
                    Par la présente, nous actons formellement les agissements frauduleux de l'utilisateur identifié ci-dessous. Cet individu s'est rendu coupable de l'infraction suivante : <strong className="uppercase bg-red-200 px-1 py-0.5 rounded">{
                      selectedAlertContext.alert?.type === 'SCREENSHOT_ATTEMPT' ? "TENTATIVE DE CAPTURE D'ÉCRAN" :
                      selectedAlertContext.alert?.type === 'PHONE_DETECTED' ? "PRISE DE VUE PAR TÉLÉPHONE/CAMÉRA DÉTECTÉE" :
                      selectedAlertContext.alert?.type === 'BLUR_LOSS' ? "CONTOURNEMENT (PERTE DE FOCUS / ENREGISTREUR EXTERNE)" :
                      selectedAlertContext.alert?.type === 'CLIPBOARD_COPY' ? "COPIE NON AUTORISÉE DANS LE PRESSE-PAPIER" :
                      selectedAlertContext.alert?.type === 'AUDIO_SCREENSHOT_DETECTED' ? "CAPTURE D'ÉCRAN DÉTECTÉE PAR SIGNATURE AUDIO" :
                      selectedAlertContext.alert?.type || "VIOLATION DE SÉCURITÉ INCONNUE"
                    }</strong> sur le document classifié <strong className="font-bold underline decoration-red-300 underline-offset-2">« {selectedAlertContext.alert?.documentTitle} »</strong> appartenant légitimement à <strong>{selectedAlertContext.owner?.onboardingData?.companyName || selectedAlertContext.owner?.name || 'la société émettrice'}</strong>.
                  </p>
                  <p>
                    Ces actes constituent une violation directe et irréfutable de l'Article III de ladite convention, engageant immédiatement sa responsabilité civile et pénale. En conséquence, l'activation de la clause pénale de <strong className="font-black text-red-700">2.000.000 à 10.000.000 FCFA</strong> est justifiée, indépendamment des poursuites judiciaires complémentaires qui pourraient être engagées par le propriétaire des données.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Informations du Contrevenant</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1">Nom / Société</span>
                      <span className="font-bold text-slate-900 text-xs">{selectedAlertContext.reader.name || selectedAlertContext.reader.onboardingData?.companyName || 'Non renseigné'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1">Email</span>
                      <span className="font-bold text-slate-900 text-xs">{selectedAlertContext.reader.email}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1">Téléphone</span>
                      <span className="font-bold text-slate-900 text-xs">{selectedAlertContext.reader.onboardingData?.phone || 'Non renseigné'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1">Secteur</span>
                      <span className="font-bold text-slate-900 text-xs">{selectedAlertContext.reader.onboardingData?.sector || 'Non renseigné'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {(selectedAlertContext.reader.initialSignature || selectedAlertContext.owner?.initialSignature) ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contrat d'Engagement Signé</h3>
                    <button 
                      onClick={() => handleDownloadContract(selectedAlertContext)}
                      className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      <Download className="w-3 h-3" /> Télécharger
                    </button>
                  </div>
                  
                  <div className="relative bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4 max-h-96 overflow-y-auto w-full custom-scrollbar">
                    <div id="contract-to-print" className="bg-white p-6 md:p-8 rounded-none border border-slate-200 font-serif relative shadow-sm">
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden z-0">
                        <ShieldCheck className="w-[100%] h-[100%] text-slate-900 max-w-full" />
                      </div>
                      
                      <div className="flex flex-col items-center border-b border-slate-300 pb-4 mb-6 relative z-10">
                        <div className="flex items-center justify-center mb-3">
                          <div className="w-12 h-12 text-slate-900 flex items-center justify-center border-2 border-slate-900 rounded-full p-2">
                            <ShieldCheck className="w-full h-full" />
                          </div>
                        </div>
                        <div className="text-center space-y-1">
                          <h2 className="text-lg md:text-xl font-serif text-slate-900 tracking-[0.15em] uppercase font-bold">PERASAFE INTERNATIONAL</h2>
                          <p className="text-[10px] font-sans font-semibold text-slate-500 uppercase tracking-[0.3em]">Protocole de Sécurité & Secret des Affaires</p>
                        </div>
                      </div>

                      <div className="mb-6 md:mb-8 relative z-10 border-l-4 border-slate-900 pl-4 md:pl-6">
                        <h1 className="text-xl md:text-2xl font-serif font-black text-slate-900 uppercase tracking-tight leading-tight">
                          Convention Générale de Confidentialité<br/>
                          et de Ratification d'Accès Stratégique
                        </h1>
                        <p className="text-slate-500 font-sans text-[10px] mt-2 uppercase tracking-widest font-bold">Session Spéciale du {selectedAlertContext.alert?.timestamp ? new Date(selectedAlertContext.alert.timestamp).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>

                      <div className="space-y-6 text-[13px] text-slate-900 leading-[1.6] text-justify relative z-10">
                        <div>
                          <h4 className="font-sans font-black text-[10px] uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-4">
                            <span>Article Premier</span>
                            <div className="flex-1 h-px bg-slate-100"></div>
                          </h4>
                          <p>
                            La présente Convention lie irrévocablement <strong className="text-slate-900">l'Émetteur {selectedAlertContext.owner?.onboardingData?.companyName ? `« ${selectedAlertContext.owner?.onboardingData?.companyName} »` : 'Responsable'}</strong>, représenté par <strong className="text-slate-900 capitalize">{selectedAlertContext.owner?.name || 'Le Propriétaire'}</strong>, et le Réceptionnaire habilité <strong className="text-slate-900 uppercase underline decoration-double underline-offset-4">{selectedAlertContext.reader.name || selectedAlertContext.reader.onboardingData?.companyName || selectedAlertContext.reader.email}</strong>. Par la présente, les parties s'engagent à respecter les plus hauts standards de probité et de réserve professionnelle.
                          </p>
                        </div>

                        <div>
                          <h4 className="font-sans font-black text-[10px] uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-4">
                            <span>Article II : Objet du Privilège</span>
                            <div className="flex-1 h-px bg-slate-100"></div>
                          </h4>
                          <p>
                            L'accès au document classifié <strong className="bg-slate-100 px-2 py-0.5 rounded">« {selectedAlertContext.alert?.documentTitle || 'Document Sécurisé'} »</strong> est accordé à titre personnel et non-transmissible. Le Réceptionnaire reconnaît que les informations divulguées constituent un actif immatériel souverain protégé par le Droit International du Secret des Affaires. Cet accès est soumis à une surveillance cryptographique continue exercée par le protocole <strong className="text-indigo-600">PERASafe</strong>.
                          </p>
                        </div>

                        <div>
                          <h4 className="font-sans font-black text-[10px] uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-4">
                            <span>Article III : Interdictions & Sanctions</span>
                            <div className="flex-1 h-px bg-slate-100"></div>
                          </h4>
                          <p>
                            Toute tentative d'extraction, de capture d'écran, de duplication ou de divulgation de l'information constitue une violation flagrante des termes de cette Convention. Une telle violation déclenche automatiquement : 
                          </p>
                          <ul className="mt-2 space-y-2 font-sans text-xs italic border-l-2 border-indigo-50 ml-4 pl-6 text-slate-600">
                            <li className="flex gap-4">
                              <span className="font-black text-indigo-600">a)</span> 
                              <span>La suspension perpétuelle de l'habilitation de sécurité du Réceptionnaire ;</span>
                            </li>
                            <li className="flex gap-4">
                              <span className="font-black text-indigo-600">b)</span>
                              <span>Le déclenchement d'une clause pénale transactionnelle de <strong className="text-slate-900 not-italic">2.000.000 à 10.000.000 FCFA</strong> ;</span>
                            </li>
                            <li className="flex gap-4">
                              <span className="font-black text-indigo-600">c)</span>
                              <span>L'ouverture d'un contentieux disciplinaire et légal devant les juridictions compétentes.</span>
                            </li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-sans font-black text-[10px] uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-4">
                            <span>Article IV : Ratification</span>
                            <div className="flex-1 h-px bg-slate-100"></div>
                          </h4>
                          <p>
                            En apposant son visa électronique, le Réceptionnaire certifie avoir pris connaissance de l'intégralité de ces dispositions et accepte de s'y soumettre sans réserve. La présente signature a pleine valeur d'instrument de ratification au sens du droit des contrats numériques.
                          </p>
                        </div>
                      </div>

                      <div className="mt-12 flex flex-col md:flex-row justify-between gap-12 font-sans relative z-10 page-break-inside-avoid px-4">
                        <SignatureDisplay 
                          isFormal
                          title="VISA DE L'ÉMETTEUR" 
                          name={selectedAlertContext.owner?.name || 'Validation Requis'} 
                          data={selectedAlertContext.owner?.initialSignature || ''}
                          roleContext={selectedAlertContext.owner?.onboardingData?.companyName || 'PROPRIÉTAIRE DES DONNÉES'} 
                        />
                        <SignatureDisplay 
                          isFormal
                          title="VISA DU RÉCEPTIONNAIRE" 
                          name={selectedAlertContext.reader.name || selectedAlertContext.reader.onboardingData?.companyName || selectedAlertContext.reader.email} 
                          data={selectedAlertContext.reader.initialSignature || ''}
                          roleContext={selectedAlertContext.reader.role === 'PARTNER' ? 'PARTENAIRE HABILITÉ' : 'UTILISATEUR CERTIFIÉ'} 
                        />
                      </div>
                      
                      <div className="mt-16 text-center">
                         <div className="inline-block border-2 border-slate-900 px-6 py-2">
                           <p className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-900">CERTIFIÉ CONFORME PAR PERASAFE</p>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 border-dashed p-8 text-center">
                  <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aucune signature enregistrée</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPanel;
