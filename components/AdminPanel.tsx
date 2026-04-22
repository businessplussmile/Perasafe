
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SecureDocument, UserProfile } from '../types';
import { PARTNER_LIMITS } from '../constants';
import { summarizeDocument } from '../services/documentService';
import { Sparkles, Loader2, Users, Image as ImageIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface AdminPanelProps {
  documents: SecureDocument[];
  profile: UserProfile | null;
  storageUsage: number;
  storageLimit: number;
  onAddDocument: (doc: Omit<SecureDocument, 'id' | 'createdAt' | 'isConsumed' | 'companyId' | 'uploaderId'>) => void;
  onImportDocuments: (docs: SecureDocument[]) => void;
  onUpdateCode: (id: string, newCode: string) => Promise<boolean>;
  onToggleStatus: (id: string) => void;
  onDeleteDocument: (id: string) => void;
}

const SIGNATURE = "PERADOC-SIG-X14";

const FONTS = [
  { label: 'Plus Jakarta', value: "'Plus Jakarta Sans', sans-serif" },
  { label: 'Crimson Pro', value: "'Crimson Pro', serif" },
  { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
  { label: 'Arial', value: "Arial, sans-serif" },
  { label: 'Georgia', value: "Georgia, serif" }
];

const SIZES = [
  { label: 'Petit', value: '2' },
  { label: 'Normal', value: '3' },
  { label: 'Médium', value: '4' },
  { label: 'Grand', value: '5' },
  { label: 'Très Grand', value: '6' },
  { label: 'Titre', value: '7' }
];

const COLORS = [
  { label: 'Noir', value: '#1e293b' },
  { label: 'Royal', value: '#643012' },
  { label: 'Or', value: '#F2AF31' },
  { label: 'Gris', value: '#94a3b8' },
  { label: 'Indigo', value: '#4f46e5' },
  { label: 'Rouge', value: '#e11d48' },
  { label: 'Vert', value: '#16a34a' }
];

const AdminPanel: React.FC<AdminPanelProps> = ({ documents, profile, storageUsage, storageLimit, onAddDocument, onImportDocuments, onUpdateCode, onToggleStatus, onDeleteDocument }) => {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [stats, setStats] = useState({ words: 0, time: 0 });
  const [activeFont, setActiveFont] = useState(FONTS[0].value);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [docSummary, setDocSummary] = useState('');
  const [validityDuration, setValidityDuration] = useState(86400000); // Default: 24h in ms
  
  const [editingDoc, setEditingDoc] = useState<SecureDocument | null>(null);
  const [newCodeInput, setNewCodeInput] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const statsTimeoutRef = useRef<number | null>(null);

  const handleCommand = (e: React.MouseEvent, command: string, value: string = '') => {
    e.preventDefault(); 
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const exportPackage = (docs: SecureDocument[], filename: string) => {
    try {
      const data = { signature: SIGNATURE, version: "1.0", timestamp: Date.now(), payload: docs };
      const jsonStr = JSON.stringify(data);
      const bytes = new TextEncoder().encode(jsonStr);
      const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
      const encoded = btoa(binString);
      const blob = new Blob([encoded], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.peravault`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (e) {
      showToast("Échec de l'exportation.", 'error');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (profile?.subscriptionTier === 'STANDARD' || profile?.subscriptionTier === 'FREE' || !profile?.subscriptionTier) {
      showToast("L'importation groupée est réservée aux abonnements PRO et BUSINESS.", 'error');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const encoded = event.target?.result as string;
        const binString = atob(encoded.trim());
        const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
        const jsonStr = new TextDecoder().decode(bytes);
        const data = JSON.parse(jsonStr);
        if (data.signature !== SIGNATURE) throw new Error("Invalid Sig");
        onImportDocuments(Array.isArray(data.payload) ? data.payload : [data.payload]);
        showToast("Importation réussie.");
      } catch (err) {
        showToast("Fichier corrompu ou invalide.", 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  const handleShareLink = () => {
    const url = `${window.location.origin}?import=true`;
    navigator.clipboard.writeText(url);
    showToast("Lien d'accès copié !");
  };

  const updateStats = useCallback(() => {
    const text = editorRef.current?.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setStats({ words, time: Math.max(1, Math.ceil(words / 200)) });
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleInput = () => {
      if (statsTimeoutRef.current) window.clearTimeout(statsTimeoutRef.current);
      // Debounce des stats pour plus de fluidité à la frappe
      statsTimeoutRef.current = window.setTimeout(updateStats, 500);
    };

    const handlePaste = (e: ClipboardEvent) => {
      const isRestricted = profile?.subscriptionTier === 'FREE' || profile?.subscriptionTier === 'STANDARD' || !profile?.subscriptionTier;
      if (!isRestricted) return;

      const items = e.clipboardData?.items;
      const html = e.clipboardData?.getData('text/html');

      // 1. Check binary items (screenshots, copied files)
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            e.preventDefault();
            showToast("Le copier-coller d'images est réservé aux abonnements PRO et BUSINESS.", 'error');
            return;
          }
        }
      }

      // 2. Check HTML content (images from web pages)
      if (html && html.toLowerCase().includes('<img')) {
        e.preventDefault();
        showToast("L'insertion d'images via HTML est réservée aux abonnements PRO et BUSINESS.", 'error');
        return;
      }
    };

    const handleDrop = (e: DragEvent) => {
      const isRestricted = profile?.subscriptionTier === 'FREE' || profile?.subscriptionTier === 'STANDARD' || !profile?.subscriptionTier;
      if (!isRestricted) return;

      const files = e.dataTransfer?.files;
      const html = e.dataTransfer?.getData('text/html');

      // 1. Check binary files
      if (files) {
        for (let i = 0; i < files.length; i++) {
          if (files[i].type.startsWith('image/')) {
            e.preventDefault();
            showToast("Le glisser-déposer d'images est réservé aux abonnements PRO et BUSINESS.", 'error');
            return;
          }
        }
      }

      // 2. Check HTML drop (images from other tabs)
      if (html && html.toLowerCase().includes('<img')) {
        e.preventDefault();
        showToast("Le transfert d'images est réservé aux abonnements PRO et BUSINESS.", 'error');
        return;
      }
    };

    editor.addEventListener('input', handleInput);
    editor.addEventListener('paste', handlePaste);
    editor.addEventListener('drop', handleDrop);
    return () => {
      editor.removeEventListener('input', handleInput);
      editor.removeEventListener('paste', handlePaste);
      editor.removeEventListener('drop', handleDrop);
      if (statsTimeoutRef.current) window.clearTimeout(statsTimeoutRef.current);
    };
  }, [updateStats, profile]);

  const [partnerEmails, setPartnerEmails] = useState('');
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const storagePercentage = Math.min(100, (storageUsage / storageLimit) * 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const content = editorRef.current?.innerHTML || '';
    if (!title || !content || !code) {
      showToast("Veuillez remplir tous les champs.", 'error');
      return;
    }
    
    const partnerIds = partnerEmails.split(',').map(email => email.trim()).filter(email => email !== '');
    
    if (partnerIds.length === 0) {
      showToast("Veuillez inviter au moins un partenaire.", 'error');
      return;
    }
    
    // Check partner limits based on subscription
    const tier = profile?.subscriptionTier || 'FREE';
    const limit = PARTNER_LIMITS[tier];
    
    if (partnerIds.length > limit) {
      showToast(`Votre forfait ${tier} limite les partenaires à ${limit} par document.`, 'error');
      return;
    }

    onAddDocument({ title, content, mimeType: 'text/html', accessCode: code, partnerIds, summary: docSummary, validityDuration });
    showToast("Document ajouté avec succès.");
    resetForm();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (profile.subscriptionTier === 'STANDARD' || profile.subscriptionTier === 'FREE' || !profile.subscriptionTier) {
      showToast("L'ajout d'images est réservé aux abonnements PRO et BUSINESS.", 'error');
      return;
    }

    setIsUploadingImage(true);
    try {
      const options = {
        maxSizeMB: 0.165, // Limit to 165 KB as requested
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        initialQuality: 0.7
      };
      
      const compressedFile = await imageCompression(file, options);
      const base64 = await imageCompression.getDataUrlFromFile(compressedFile);
      
      if (editorRef.current) {
        editorRef.current.focus();
        document.execCommand('insertHTML', false, `
          <div style="margin: 2rem 0; text-align: center;">
            <img src="${base64}" style="width: 100%; max-width: 600px; border-radius: 1.5rem; display: block; margin: 0 auto; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1);" />
            <p style="font-size: 10px; color: #94a3b8; margin-top: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">Image Chiffrée & Optimisée</p>
          </div>
          <p><br /></p>
        `);
      }
      
      showToast('Média optimisé (165 Ko max).', 'success');
    } catch (error) {
      console.error(error);
      showToast("Erreur lors de l'optimisation média.", 'error');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const generateSummary = async () => {
    if (profile?.subscriptionTier === 'STANDARD' || profile?.subscriptionTier === 'FREE' || !profile?.subscriptionTier) {
      showToast("La synthèse stratégique IA est réservée aux abonnements PRO et BUSINESS.", 'error');
      return;
    }
    
    const content = editorRef.current?.innerText || '';
    if (!content || content.length < 50) {
      showToast("Contenu trop court pour l'analyse.", 'error');
      return;
    }
    setIsSummarizing(true);
    try {
      const summary = await summarizeDocument(content);
      setDocSummary(summary);
      showToast("Synthèse stratégique générée.");
    } catch (error) {
      showToast("Erreur lors de l'analyse.", 'error');
    } finally {
      setIsSummarizing(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    if (editorRef.current) editorRef.current.innerHTML = '';
    setCode('');
    setPartnerEmails('');
    setDocSummary('');
    setStats({ words: 0, time: 0 });
  };

  const handleConfirmCodeUpdate = () => {
    if (!editingDoc || !newCodeInput.trim()) return;
    const success = onUpdateCode(editingDoc.id, newCodeInput.trim());
    if (success) {
      showToast("Code mis à jour.");
      setEditingDoc(null);
      setNewCodeInput('');
    } else {
      showToast("Erreur lors de la mise à jour.", 'error');
    }
  };

  return (
    <div className={`max-w-6xl mx-auto px-4 py-6 md:py-12 space-y-8 animate-fade-in pb-40 ${isFullScreen ? 'overflow-hidden' : ''}`}>
      
      {/* Barre de stockage */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <i className="fas fa-database text-xl"></i>
          </div>
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Espace de Stockage</h4>
            <div className="text-sm font-black text-slate-900">{formatBytes(storageUsage)} / {formatBytes(storageLimit)}</div>
          </div>
        </div>
        <div className="flex-1 w-full max-w-md">
          <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">
            <span>Utilisation</span>
            <span>{Math.round(storagePercentage)}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div 
              className={`h-full transition-all duration-1000 ${storagePercentage > 90 ? 'bg-red-500' : 'bg-indigo-600'}`}
              style={{ width: `${storagePercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 rounded-2xl shadow-2xl font-black text-[10px] uppercase tracking-widest animate-fade-in border flex items-center gap-3 ${toast.type === 'success' ? 'bg-white border-green-100 text-green-600' : 'bg-white border-red-100 text-red-600'}`}>
          <i className={`fas ${toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
          {toast.message}
        </div>
      )}

      {editingDoc && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 text-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <i className="fas fa-key text-2xl"></i>
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Modifier le Code</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-3 mb-8">Nouveau pivot pour "{editingDoc.title}"</p>
            
            <div className="space-y-6">
              <input 
                type="text" 
                autoFocus 
                value={newCodeInput} 
                onChange={(e) => setNewCodeInput(e.target.value)} 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-[#643012] outline-none font-mono text-xl text-center focus:border-[#F2AF31] transition-all shadow-inner" 
                placeholder="NOUVEAU-CODE" 
              />
              <div className="flex flex-col gap-3">
                <button onClick={handleConfirmCodeUpdate} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg btn-active">Sauvegarder</button>
                <button onClick={() => setEditingDoc(null)} className="w-full text-slate-400 font-bold py-2 text-[9px] uppercase tracking-widest">Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInstructions && (
        <div className="bg-[#643012] text-white p-6 md:p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-1000"></div>
          <button onClick={() => setShowInstructions(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"><i className="fas fa-times text-xs"></i></button>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="bg-[#F2AF31] text-[#643012] w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg"><i className="fas fa-circle-info"></i></div>
            <div className="space-y-3">
              <h3 className="font-black uppercase tracking-widest text-[12px]">Protocole Opérationnel PERADoc</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-[#F2AF31] uppercase tracking-widest block">01. Sécurité</span>
                  <p className="text-[11px] opacity-80 leading-relaxed font-medium">Chaque document est chiffré localement (XOR). Seul le code pivot permet sa lecture.</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-[#F2AF31] uppercase tracking-widest block">02. Auto-destruction</span>
                  <p className="text-[11px] opacity-80 leading-relaxed font-medium">Après la 1ère lecture, le document est accessible pendant 24h avant révocation automatique.</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-[#F2AF31] uppercase tracking-widest block">03. Accès Sélectif</span>
                  <p className="text-[11px] opacity-80 leading-relaxed font-medium">L'invitation par email est obligatoire. Sans cela, l'accès est bloqué même avec le bon code.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <section id="tour-admin-editor" className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="bg-slate-50/80 p-6 md:p-10 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
            <div className="flex-1 w-full space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#643012] rounded-xl flex items-center justify-center text-[#F2AF31] shadow-xl">
                  <i className="fas fa-pen-nib text-sm"></i>
                </div>
                <div className="flex-1 flex justify-between items-center">
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Rédaction Stratégique</h2>
                  <button 
                    type="button"
                    onClick={generateSummary}
                    disabled={isSummarizing || profile?.subscriptionTier === 'STANDARD' || profile?.subscriptionTier === 'FREE'}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSummarizing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3" />}
                    {isSummarizing ? 'Analyse...' : 'Synthèse Stratégique'}
                  </button>
                </div>
              </div>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent border-b-2 border-slate-200 py-2 text-2xl font-black text-slate-900 outline-none focus:border-[#F2AF31] transition-all"
                placeholder="Titre du document..."
              />
              {docSummary && (
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 animate-fade-in">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2 mb-1">
                    <Sparkles className="w-2.5 h-2.5" /> Résumé Stratégique
                  </p>
                  <p className="text-[11px] text-slate-600 italic">"{docSummary}"</p>
                </div>
              )}
            </div>
            <div id="tour-admin-settings" className="w-full md:w-auto shrink-0 flex flex-col md:flex-row gap-4">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 flex justify-between">
                  <span>Partenaires (Obligatoire)</span>
                  <span className="text-indigo-600">Limite: {PARTNER_LIMITS[profile?.subscriptionTier || 'FREE']}</span>
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={partnerEmails}
                    onChange={(e) => setPartnerEmails(e.target.value)}
                    className="bg-white border-2 border-slate-100 rounded-xl p-4 pr-12 text-slate-600 font-bold w-full md:w-[300px] outline-none shadow-inner focus:border-indigo-600"
                    placeholder="email1@partenaire.com, email2@..."
                  />
                  <Users className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Durée de validité (après ouverture)</label>
                <select 
                  value={validityDuration}
                  onChange={(e) => setValidityDuration(Number(e.target.value))}
                  className="bg-white border-2 border-slate-100 rounded-xl p-4 text-slate-600 font-bold w-full md:w-[180px] outline-none shadow-inner focus:border-indigo-600 cursor-pointer appearance-none"
                >
                  <option value={3600000}>1 Heure</option>
                  <option value={43200000}>12 Heures</option>
                  <option value={86400000}>24 Heures</option>
                  <option value={172800000}>48 Heures</option>
                  <option value={604800000}>7 Jours</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Code d'accès requis</label>
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="bg-white border-2 border-slate-100 rounded-xl p-4 text-[#643012] font-mono font-black text-center w-full md:w-[200px] outline-none shadow-inner focus:border-[#F2AF31]"
                  placeholder="CODE-XXXX"
                />
              </div>
            </div>
          </div>

          <div className={`relative p-0 md:p-0 bg-slate-100/50 ${isFullScreen ? 'fixed inset-0 z-[100] bg-slate-200/80 backdrop-blur-md overflow-y-auto' : ''}`}>
            {isFullScreen && (
              <div className="fixed top-4 right-4 z-[120]">
                 <button type="button" onClick={() => setIsFullScreen(false)} className="bg-slate-900 text-white w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"><i className="fas fa-times"></i></button>
              </div>
            )}

            <div className={`bg-white px-4 py-3 border-b border-slate-100 flex items-center gap-1 overflow-x-auto shadow-sm scrollbar-hide ${isFullScreen ? 'sticky top-0 z-[110]' : 'sticky top-0 z-40'}`}>
              <div className="flex items-center gap-0.5 border-r border-slate-100 pr-1 mr-1">
                <button type="button" onMouseDown={(e) => handleCommand(e, 'undo')} className="w-8 h-8 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors" title="Annuler"><i className="fas fa-undo text-[10px]"></i></button>
                <button type="button" onMouseDown={(e) => handleCommand(e, 'redo')} className="w-8 h-8 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors" title="Rétablir"><i className="fas fa-redo text-[10px]"></i></button>
              </div>

              <div className="flex items-center gap-1.5 border-r border-slate-100 pr-3 mr-1">
                <select 
                  onChange={(e) => { setActiveFont(e.target.value); document.execCommand('fontName', false, e.target.value); }}
                  className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 text-[9px] font-bold text-slate-600 outline-none cursor-pointer"
                >
                  {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                <select 
                  onChange={(e) => document.execCommand('fontSize', false, e.target.value)}
                  className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 text-[9px] font-bold text-slate-600 outline-none cursor-pointer"
                  defaultValue={'3'}
                >
                  {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-0.5 border-r border-slate-100 pr-1 mr-1">
                <button type="button" onMouseDown={(e) => handleCommand(e, 'bold')} className="w-9 h-9 rounded-lg hover:bg-slate-100 text-slate-800 font-black" title="Gras"><i className="fas fa-bold text-xs"></i></button>
                <button type="button" onMouseDown={(e) => handleCommand(e, 'italic')} className="w-9 h-9 rounded-lg hover:bg-slate-100 text-slate-800" title="Italique"><i className="fas fa-italic text-xs"></i></button>
                <button type="button" onMouseDown={(e) => handleCommand(e, 'underline')} className="w-9 h-9 rounded-lg hover:bg-slate-100 text-slate-800" title="Souligné"><i className="fas fa-underline text-xs"></i></button>
              </div>

              <div className="flex items-center gap-0.5 border-r border-slate-100 pr-1 mr-1">
                <div className="relative group/color">
                  <button type="button" className="w-9 h-9 rounded-lg hover:bg-slate-100 text-[#643012] flex flex-col items-center justify-center gap-0.5" title="Couleur du texte">
                    <i className="fas fa-font text-xs"></i>
                    <div className="w-4 h-[2px] bg-[#643012]"></div>
                  </button>
                  <div className="absolute hidden group-hover/color:grid grid-cols-4 gap-1 bg-white p-2 rounded-xl shadow-2xl border border-slate-100 top-full left-0 z-50 min-w-[100px]">
                    {COLORS.map(c => (
                      <button key={c.value} type="button" onMouseDown={(e) => handleCommand(e, 'foreColor', c.value)} className="w-5 h-5 rounded-full border border-slate-100 shadow-sm" style={{ backgroundColor: c.value }} title={c.label} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-0.5 border-r border-slate-100 pr-1 mr-1">
                <button type="button" onMouseDown={(e) => handleCommand(e, 'justifyLeft')} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-600" title="Aligner à gauche"><i className="fas fa-align-left text-[10px]"></i></button>
                <button type="button" onMouseDown={(e) => handleCommand(e, 'justifyCenter')} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-600" title="Centrer"><i className="fas fa-align-center text-[10px]"></i></button>
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  className={`bg-[#643012] text-[#F2AF31] px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2 ${(profile?.subscriptionTier === 'STANDARD' || profile?.subscriptionTier === 'FREE' || !profile?.subscriptionTier) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isUploadingImage || profile?.subscriptionTier === 'STANDARD' || profile?.subscriptionTier === 'FREE' || !profile?.subscriptionTier}
                >
                  {isUploadingImage ? <Loader2 className="w-3 h-3 animate-spin"/> : <ImageIcon className="w-3 h-3" />}
                  <span className="hidden lg:inline">{isUploadingImage ? 'Compression...' : 'Média'}</span>
                </button>
                <button type="button" onClick={() => setIsFullScreen(!isFullScreen)} className="w-8 h-8 text-slate-300 hover:text-[#643012] transition-colors"><i className={`fas ${isFullScreen ? 'fa-compress' : 'fa-expand'} text-[10px]`}></i></button>
              </div>
            </div>

            <div className={`w-full relative ${isFullScreen ? 'mt-4 max-w-5xl mx-auto' : ''}`}>
              <div className="relative bg-white shadow-2xl min-h-[60vh] lg:min-h-[1100px] border border-slate-100 flex flex-col">
                 
                 <div className="h-4 md:h-6 bg-[#643012] w-full"></div>

                 <div className="absolute inset-0 pointer-events-none select-none opacity-[0.02] z-0" 
                      style={{ 
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='500' height='250' viewBox='0 0 500 250' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='0' y='120' font-family='sans-serif' font-weight='900' font-size='14' fill='black' transform='rotate(-20 50 120)'%3EPERAFIND STRATEGIC INTELLIGENCE%3C/text%3E%3C/svg%3E")`,
                        backgroundRepeat: 'repeat'
                      }} 
                 />

                 <div className="pt-16 pb-12 flex flex-col items-center relative z-10 px-8 md:px-24 lg:px-40">
                    <div className="bg-[#F2AF31] rounded-full px-8 py-2.5 flex items-center gap-3 shadow-md mb-16">
                       <i className="fas fa-shield-halved text-[#643012] text-xs"></i>
                       <span className="text-[#643012] text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em]">Niveau 5 Executive Access</span>
                    </div>

                    <div className="max-w-4xl text-center">
                       <p className="text-[#8fa1b4] text-[9px] md:text-[11px] font-bold uppercase tracking-[0.15em] leading-[1.8] opacity-80">
                          CE DOCUMENT EST LA PROPRIÉTÉ EXCLUSIVE DE PERAFIND. TOUTE REPRODUCTION OU DIVULGATION CONSTITUE UNE FAUTE GRAVE.
                       </p>
                    </div>

                    <div className="w-full h-[1px] bg-slate-100 mt-16 max-w-6xl mx-auto"></div>
                 </div>

                 <div 
                   ref={editorRef} 
                   contentEditable 
                   spellCheck="false"
                   className="flex-1 outline-none px-8 md:px-24 lg:px-40 py-4 pb-40 text-slate-800 text-lg md:text-[22px] leading-[1.9] min-h-[600px] editor-content relative z-10" 
                   style={{ fontFamily: activeFont }}
                 />
                 
                 <div className="pb-12 pt-8 border-t border-slate-50 px-8 md:px-24 flex justify-between items-center opacity-10 pointer-events-none select-none mt-auto">
                    <div className="w-10 h-10 border-2 border-[#643012] flex items-center justify-center rounded-full"><i className="fas fa-file-shield text-[10px]"></i></div>
                    <div className="text-[8px] font-black uppercase tracking-widest text-center">PROTÉGER PAR PERASAFE</div>
                    <div className="text-[10px] font-mono">PAGE 01 / 01</div>
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50/50 px-8 py-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-8">
               <div className="flex flex-col">
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Contenu Brut</span>
                  <span className="text-sm font-black text-slate-900">{stats.words} Mots</span>
               </div>
               <div className="w-[1px] h-6 bg-slate-200"></div>
               <div className="flex flex-col">
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Durée d'exposition</span>
                  <span className="text-sm font-black text-slate-900">{stats.time} Minutes</span>
               </div>
            </div>
            <div className="flex gap-3 md:gap-4 w-full md:w-auto">
              <button 
                type="button" 
                onClick={resetForm} 
                className="flex-1 md:flex-none bg-slate-100 text-slate-600 font-black px-8 py-4 md:py-6 rounded-2xl text-[9px] md:text-[10px] uppercase tracking-widest btn-active transition-all"
              >
                Vider
              </button>
              <button 
                id="tour-admin-save"
                type="submit" 
                className="flex-1 md:flex-none bg-indigo-600 text-white font-black px-10 py-4 md:py-6 rounded-2xl text-[9px] md:text-[10px] uppercase tracking-widest shadow-lg btn-active transition-all"
              >
                Ajouter au Coffre
              </button>
            </div>
          </div>
        </form>
      </section>

      <section id="tour-admin-inventory" className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-xl">
        <div className="p-8 md:p-12 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-slate-50/20">
          <div>
             <h3 className="font-black text-2xl text-slate-900 uppercase tracking-tighter">Packages Actifs</h3>
             <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Gestion de l'inventaire confidentiel</p>
          </div>
          <div className="flex gap-3 md:gap-4 w-full md:w-auto">
            <input type="file" ref={importFileInputRef} className="hidden" accept=".peravault" onChange={handleImport} />
            <button 
              onClick={() => importFileInputRef.current?.click()} 
              disabled={profile?.subscriptionTier === 'STANDARD' || profile?.subscriptionTier === 'FREE'}
              className={`flex-1 md:flex-none bg-slate-100 text-slate-600 font-black px-8 py-4 md:py-6 rounded-2xl text-[9px] md:text-[10px] uppercase tracking-widest btn-active transition-all ${(profile?.subscriptionTier === 'STANDARD' || profile?.subscriptionTier === 'FREE' || !profile?.subscriptionTier) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Importer
            </button>
            <button 
              onClick={() => exportPackage(documents, 'vault-backup')} 
              disabled={profile?.subscriptionTier === 'STANDARD' || profile?.subscriptionTier === 'FREE'}
              className={`flex-1 md:flex-none bg-indigo-600 text-white font-black px-8 py-4 md:py-6 rounded-2xl text-[9px] md:text-[10px] uppercase tracking-widest shadow-lg btn-active transition-all ${(profile?.subscriptionTier === 'STANDARD' || profile?.subscriptionTier === 'FREE' || !profile?.subscriptionTier) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Sauvegarder tout
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left">
            <thead className="text-[9px] uppercase text-slate-400 bg-slate-50/50">
              <tr>
                <th className="px-8 py-6">ID du Package</th>
                <th className="px-8 py-6">Code Pivot</th>
                <th className="px-8 py-6 text-center">Status</th>
                <th id="tour-admin-actions" className="px-8 py-6 text-right">Opérations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-300 font-bold uppercase text-[10px] tracking-[0.3em]">Coffre vide</td>
                </tr>
              ) : (
                documents.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-8 py-8">
                      <div className="flex flex-col">
                         <span className="font-black text-sm text-slate-900 uppercase truncate max-w-[200px]">{doc.title}</span>
                         <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">UUID: {doc.id}</span>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <div className="bg-slate-100 px-3 py-1.5 rounded-lg inline-block">
                        <span className="font-mono text-[10px] text-[#643012] font-black tracking-widest">{doc.accessCode}</span>
                      </div>
                    </td>
                    <td className="px-8 py-8 text-center">
                      <button 
                        onClick={() => onToggleStatus(doc.id)} 
                        className={`text-[8px] px-4 py-2 rounded-xl font-black transition-all ${doc.isConsumed ? 'bg-slate-100 text-slate-400' : 'bg-green-50 text-green-700'}`}
                      >
                        {doc.isConsumed ? 'RÉVOQUÉ' : 'OPÉRATIONNEL'}
                      </button>
                    </td>
                    <td className="px-8 py-8 text-right whitespace-nowrap">
                      <button 
                        onClick={handleShareLink} 
                        className="text-emerald-500 p-3 hover:bg-emerald-50 rounded-xl transition-all mr-2" 
                        title="Copier le lien partenaire"
                      >
                        <i className="fas fa-link text-xs"></i>
                      </button>
                      <button 
                        onClick={() => { setEditingDoc(doc); setNewCodeInput(doc.accessCode); }} 
                        className="text-indigo-600 p-3 hover:bg-indigo-50 rounded-xl transition-all mr-2" 
                        title="Changer le code"
                      >
                        <i className="fas fa-key text-xs"></i>
                      </button>
                      <button onClick={() => exportPackage([doc], doc.title)} className="text-[#643012] p-3 hover:bg-[#643012]/5 rounded-xl transition-all mr-2" title="Exporter"><i className="fas fa-file-export text-xs"></i></button>
                      <button onClick={() => onDeleteDocument(doc.id)} className="text-red-200 hover:text-red-600 p-3 hover:bg-red-50 rounded-xl transition-all" title="Supprimer"><i className="fas fa-trash-can text-xs"></i></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .editor-content:empty:before { content: 'Établissez ici votre document officiel...'; color: #cbd5e1; font-style: italic; font-size: 16px; line-height: 1.6; }
      `}</style>
    </div>
  );
};

export default AdminPanel;
