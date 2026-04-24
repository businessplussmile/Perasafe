import React, { useEffect, useState } from 'react';
import { db } from '../services/firebaseService';
import { collectionGroup, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { SecureDocument, UserProfile } from '../types';
import { X, Ban, Trash2, Shield, RefreshCcw, FileText } from 'lucide-react';

interface UserDocumentsModalProps {
  user: UserProfile;
  onClose: () => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

interface ExtendedSecureDocument extends SecureDocument {
  path: string;
  companyIdPath: string;
}

const UserDocumentsModal: React.FC<UserDocumentsModalProps> = ({ user, onClose, showToast }) => {
  const [documents, setDocuments] = useState<ExtendedSecureDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try querying by uploaderId across all documents subcollections
    const q = query(
      collectionGroup(db, 'documents'),
      where('uploaderId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => {
        // Find the companyId from the doc path, which looks like companies/someCompanyId/documents/docId
        const companyIdMatch = d.ref.path.match(/companies\/([^/]+)\//);
        const companyIdPath = companyIdMatch ? companyIdMatch[1] : '';
        return { 
          id: d.id, 
          path: d.ref.path,
          companyIdPath,
          ...d.data() 
        } as ExtendedSecureDocument;
      });
      setDocuments(docs);
      setLoading(false);
    }, (error) => {
       console.error("Docs load error:", error);
       setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const toggleBlockDoc = async (docObj: ExtendedSecureDocument) => {
    try {
      const newStatus = !docObj.isBlocked;
      const refToUpdate = doc(db, docObj.path);
      await updateDoc(refToUpdate, { isBlocked: newStatus });
      showToast(`Document ${newStatus ? 'bloqué' : 'débloqué'}.`);
    } catch (e: any) {
      console.error("Block error:", e);
      showToast(`Erreur: ${e.message || "Action refusée"}`, "error");
    }
  };

  const deleteDocument = async (docObj: ExtendedSecureDocument) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce document ?")) return;
    try {
      const refToDelete = doc(db, docObj.path);
      await deleteDoc(refToDelete);
      showToast(`Document supprimé.`);
    } catch (e: any) {
      console.error("Delete error:", e);
      showToast(`Erreur: ${e.message || "Action refusée"}`, "error");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative z-10 overflow-hidden border border-slate-100">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5" />
             </div>
             <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Documents de {user.name || user.email.split('@')[0]}</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{documents.length} document(s)</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm border border-slate-200" title="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {loading ? (
            <div className="flex justify-center p-12">
               <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center p-12 opacity-50">
              <FileText className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Aucun document</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {documents.map(docObj => (
                <div key={docObj.id} className={`bg-white border rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${docObj.isBlocked ? 'border-red-200 bg-red-50/30' : 'border-slate-100 shadow-sm'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                       <h4 className="font-black text-sm text-slate-800">{docObj.title || 'Document sans titre'}</h4>
                       {docObj.isBlocked && <span className="bg-red-100 text-red-600 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">BLOQUÉ</span>}
                    </div>
                    <div className="flex flex-wrap gap-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                       <span>ID: {docObj.id.substring(0,8)}...</span>
                       <span>•</span>
                       <span>Date: {new Date(docObj.createdAt).toLocaleDateString()}</span>
                       <span>•</span>
                       <span>Vu: {docObj.isConsumed ? 'Oui' : 'Non'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                     <button
                       onClick={() => toggleBlockDoc(docObj)}
                       className={`flex-1 md:flex-none px-4 py-2 flex justify-center items-center gap-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${docObj.isBlocked ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600'}`}
                     >
                       {docObj.isBlocked ? <RefreshCcw className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                       {docObj.isBlocked ? 'Débloquer' : 'Bloquer'}
                     </button>
                     <button
                       onClick={() => deleteDocument(docObj)}
                       className="w-10 h-10 flex-none flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-colors border border-red-100"
                       title="Supprimer"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDocumentsModal;
