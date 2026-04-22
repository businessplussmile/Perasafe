import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/firebaseService';
import { collection, query, onSnapshot, doc, updateDoc, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { UserProfile } from '../types';
import { CheckCircle, XCircle, Clock, User, Mail, Shield, Users as UsersIcon, Ban, Trash2, Calendar, RefreshCcw, AlertTriangle } from 'lucide-react';

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

    return () => unsubscribe();
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
      </div>
    </div>
  );
};

export default SuperAdminPanel;
