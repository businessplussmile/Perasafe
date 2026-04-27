
import React, { useState, useRef, useEffect } from 'react';
import { SecureDocument } from '../types';
import { decryptContent } from '../services/documentService';
import SignatureCanvas from 'react-signature-canvas';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle2, ShieldCheck, PenTool, X, FileText, Download } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebaseService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface UserDocGridProps {
  documents: SecureDocument[];
  onOpenDoc: (doc: SecureDocument, code: string) => void;
  isAdmin?: boolean;
  onDeleteDoc?: (id: string) => void;
  onImportDocuments?: (docs: SecureDocument[]) => void;
  currentCompanyId?: string;
  onNotifyEvent?: (title: string, message: string, solution?: string) => void;
}

const SignatureDisplay: React.FC<{ data: string, title?: string, name: string, isFormal?: boolean, roleContext?: string }> = ({ data, title, name, isFormal, roleContext }) => {
  const ref = useRef<any>(null);
  
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
        <p className="text-sm font-bold text-slate-900 uppercase">{name}</p>
        <p className="text-[10px] text-slate-500 uppercase mt-1">{roleContext}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{title}</span>
      <div className="w-full relative h-24 bg-white border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
        {isDataUrl ? (
          <img src={data} alt="Signature" className="max-w-full max-h-full object-contain pointer-events-none mix-blend-multiply" />
        ) : (
          <SignatureCanvas ref={ref} penColor="#0f172a" canvasProps={{ className: "w-full h-full pointer-events-none" }} />
        )}
      </div>
      <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mt-2">{name}</span>
    </div>
  );
};

const SIGNATURE = "PERADOC-SIG-X14";

const UserDocGrid: React.FC<UserDocGridProps> = ({ documents, onOpenDoc, isAdmin, onDeleteDoc, onImportDocuments, currentCompanyId, onNotifyEvent }) => {
  const { profile } = useAuth();
  const [selectedDoc, setSelectedDoc] = useState<SecureDocument | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [activeStep, setActiveStep] = useState<'WARNING' | 'SIGNATURE' | 'CONTRACT' | 'SUCCESS' | 'CODE'>('WARNING');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [sigError, setSigError] = useState('');
  const [partnerSignatureData, setPartnerSignatureData] = useState<string>('');
  const [ownerInfo, setOwnerInfo] = useState<{name: string, signature: string, companyName: string} | null>(null);
  const sigPad = useRef<any>(null);
  const contractRef = useRef<HTMLDivElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const downloadContract = async () => {
    if (!contractRef.current) return;
    const element = contractRef.current;
    
    // Temporarily hide the buttons for the capture
    const buttons = element.querySelector('.contract-actions');
    if (buttons) (buttons as HTMLElement).style.display = 'none';

    try {
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollY: -window.scrollY,
        height: element.scrollHeight,
        windowHeight: element.scrollHeight
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

      pdf.save(`CONTRAT_CONFIDENTIALITE_${selectedDoc?.title.toUpperCase().replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      console.error("PDF Export failed", e);
    } finally {
      if (buttons) (buttons as HTMLElement).style.display = 'flex';
    }
  };

  useEffect(() => {
    if (selectedDoc) {
      if (selectedDoc.uploaderName && selectedDoc.uploaderSignature) {
        setOwnerInfo({
          name: selectedDoc.uploaderName,
          signature: selectedDoc.uploaderSignature,
          companyName: selectedDoc.companyName || 'La Société'
        });
      } else if (selectedDoc.uploaderId) {
        const fetchOwner = async () => {
          try {
            const ownerDoc = await getDoc(doc(db, 'users', selectedDoc.uploaderId));
            if (ownerDoc.exists()) {
              setOwnerInfo({
                name: ownerDoc.data().name || 'Le Propriétaire',
                signature: ownerDoc.data().initialSignature || '',
                companyName: selectedDoc.companyName || 'La Société'
              });
            }
          } catch (e) {
            console.error("Could not fetch owner", e);
            // Fallback inside catch if fetching fails due to permissions (e.g., for partners on older documents)
            setOwnerInfo({
              name: 'Le Propriétaire',
              signature: '',
              companyName: selectedDoc.companyName || 'La Société'
            });
          }
        };
        fetchOwner();
      }
    }
  }, [selectedDoc]);

  const handleOpenDocClick = (doc: SecureDocument) => {
    setSelectedDoc(doc);
    if (doc.uploaderId === profile?.uid || profile?.role === 'ADMIN') {
      setActiveStep('CODE');
    } else {
      setActiveStep('WARNING');
    }
  };

  useEffect(() => {
    if (activeStep === 'SIGNATURE' && profile?.initialSignature) {
      setTimeout(() => {
        try {
          if (!profile.initialSignature.startsWith('data:image')) {
            sigPad.current?.fromData(JSON.parse(profile.initialSignature));
            setIsSigning(true);
          }
        } catch (e) {}
      }, 50);
    }
  }, [activeStep, profile]);

  const resetModal = () => {
    setSelectedDoc(null);
    setInputCode('');
    setActiveStep('WARNING');
    setError('');
    setSigError('');
  };

  const compareSignatures = () => {
    const currentData = sigPad.current?.toData() || [];
    if (!currentData || currentData.length === 0) return false;
    return true;
  };

  const handleSignatureConfirm = () => {
    if (!isSigning) return;
    
    if (compareSignatures()) {
      setPartnerSignatureData(JSON.stringify(sigPad.current?.toData() || []));
      setActiveStep('CONTRACT');
      setSigError('');
    } else {
      setSigError("Signature non conforme à votre signature initiale enregistrée lors de l'inscription.");
      // Auto-clear after 3s to let them retry
      setTimeout(() => setSigError(''), 4000);
    }
  };

  const isDocExpired = (doc: SecureDocument) => {
    if (isAdmin) return false; // Never expired for owner/admin
    if (doc.isConsumed) return true;
    if (doc.lifespanStart) {
      const now = Date.now();
      const duration = doc.validityDuration || 24 * 60 * 60 * 1000;
      return now - doc.lifespanStart >= duration;
    }
    return false;
  };

  const searchableDocuments = React.useMemo(() => {
    return documents.map(doc => {
      if (doc.keywords) return doc;
      try {
        return {
          ...doc,
          _decryptedContent: decryptContent(doc.content, doc.accessCode).toLowerCase()
        };
      } catch (e) {
        return doc;
      }
    });
  }, [documents]);

  const filteredDocuments = React.useMemo(() => {
    if (!searchQuery.trim()) return searchableDocuments;
    
    const query = searchQuery.toLowerCase().trim();
    return searchableDocuments.filter(doc => {
      // Search in title
      if (doc.title.toLowerCase().includes(query)) return true;
      // Search in summary
      if (doc.summary && doc.summary.toLowerCase().includes(query)) return true;
      // Search in keywords (pre-extracted)
      if (doc.keywords && doc.keywords.some(k => k.toLowerCase().includes(query))) return true;
      
      // Fallback to pre-decrypted content for old docs
      if ((doc as any)._decryptedContent && (doc as any)._decryptedContent.includes(query)) return true;
      
      return false;
    });
  }, [searchableDocuments, searchQuery]);

  const activeDocsCount = documents.filter(d => !isDocExpired(d)).length;
  const expiredDocsCount = documents.filter(d => isDocExpired(d)).length;

  const handleUnlock = () => {
    if (!selectedDoc) return;
    if (inputCode === selectedDoc.accessCode) {
      if (isDocExpired(selectedDoc)) {
        setError("Accès révoqué définitivement.");
        return;
      }
      onOpenDoc(selectedDoc, inputCode);
      resetModal();
    } else {
      setError("Identification erronée.");
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImportDocuments) return;
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
        if (onNotifyEvent) {
          onNotifyEvent("Injection réussie", "Les documents sécurisés ont été ajoutés à votre espace personnel avec succès.");
        } else {
          setTimeout(() => alert(`Succès de l'injection.`), 300);
        }
      } catch (err) {
        if (onNotifyEvent) {
          onNotifyEvent("Package non reconnu", "Le système n'a pas pu vérifier la signature de sécurité du fichier.", "Veuillez vous assurer qu'il s'agit d'un fichier .peravault valide généré par la plateforme.");
        } else {
          alert("Fichier non reconnu.");
        }
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('import') === 'true') {
      setTimeout(() => {
        importFileInputRef.current?.click();
      }, 500); // slight delay for smooth entry
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-16 animate-fade-in pb-40 pt-8 md:pt-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10 mb-10 md:mb-20">
        <div className="max-w-2xl">
          <div 
            className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] mb-4 shadow-sm"
            style={{ backgroundColor: '#F2AF31', color: '#643012' }}
          >
             <i className="fas fa-triangle-exclamation"></i> Accès Conseil PeraFind
          </div>
          <h2 className="text-3xl md:text-6xl font-black text-slate-900 tracking-tighter mb-4 uppercase leading-[0.9]">Intelligence Stratégique<span className="text-indigo-600">.</span></h2>
          <p className="text-slate-500 text-sm md:text-lg font-medium leading-relaxed max-w-xl">
            Ces documents sont classés <span className="text-slate-900 font-bold">Secret d'Entreprise</span>. Il est formellement interdit de divulguer, de copier ou de discuter de leur contenu.
          </p>

          <div className="mt-8 relative group max-w-md">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <i className="fas fa-search text-slate-400 group-focus-within:text-indigo-600 transition-colors"></i>
            </div>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="RECHERCHER PAR TITRE, RÉSUMÉ OU MOTS-CLÉS..."
              className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-[10px] font-black uppercase tracking-widest text-slate-900 focus:border-indigo-600 outline-none shadow-sm transition-all placeholder:text-slate-300"
            />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 md:gap-8 items-start sm:items-center w-full md:w-auto">
          <div className="flex items-center w-full sm:w-auto">
            <input type="file" ref={importFileInputRef} className="hidden" accept=".peravault" onChange={handleImport} />
            <button 
              id="tour-user-import"
              onClick={() => importFileInputRef.current?.click()}
              className="w-full sm:w-auto bg-white border border-slate-200 text-slate-500 px-4 md:px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm btn-active hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <i className="fas fa-file-import text-[10px]"></i> Importer Package
            </button>
          </div>
          <div className="flex gap-3 md:gap-4 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none bg-white px-5 md:px-6 py-3 md:py-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col min-w-[100px] md:min-w-[120px]">
              <span className="text-slate-400 text-[8px] md:text-[9px] font-black uppercase tracking-widest mb-0.5">Dossiers</span>
              <span className="text-xl md:text-2xl font-black text-slate-900">{activeDocsCount}</span>
            </div>
            <div className="flex-1 sm:flex-none bg-slate-100 px-5 md:px-6 py-3 md:py-4 rounded-2xl border border-slate-200 flex flex-col min-w-[100px] md:min-w-[120px]">
              <span className="text-slate-400 text-[8px] md:text-[9px] font-black uppercase tracking-widest mb-0.5">Archives</span>
              <span className="text-xl md:text-2xl font-black text-slate-400">{expiredDocsCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div id="tour-user-vault" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-10">
        {filteredDocuments.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <i className="fas fa-search text-4xl text-slate-200 mb-6 block"></i>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucun document stratégique ne correspond à votre recherche</p>
          </div>
        ) : (
          filteredDocuments.map(doc => {
            const expired = isDocExpired(doc);
            const blocked = doc.isBlocked;
            return (
            <div 
              key={doc.id}
              className={`group relative rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 transition-all duration-500 border-2 ${
                blocked 
                  ? 'bg-red-50 border-red-200 cursor-not-allowed opacity-80' 
                  : expired 
                    ? 'bg-slate-50 border-slate-100 cursor-not-allowed grayscale opacity-50' 
                    : 'bg-white border-white hover:border-indigo-600/30 cursor-pointer shadow-md hover:shadow-xl'
              }`}
            >
              {isAdmin && onDeleteDoc && doc.companyId === currentCompanyId && (
                <button 
                  id={`tour-user-delete-${doc.id}`}
                  onClick={(e) => { e.stopPropagation(); onDeleteDoc(doc.id); }}
                  className="absolute top-4 right-4 md:top-6 md:right-6 w-9 h-9 md:w-10 md:h-10 rounded-xl bg-red-50 text-red-500 sm:opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white z-10 flex items-center justify-center btn-active"
                >
                  <i className="fas fa-trash-can text-[10px] md:text-xs"></i>
                </button>
              )}

              <button 
                id={`tour-user-open-${doc.id}`}
                onClick={() => !expired && !blocked && handleOpenDocClick(doc)}
                className="relative h-full w-full text-left bg-transparent border-none appearance-none cursor-pointer"
                disabled={blocked || expired}
              >
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center mb-5 md:mb-10 transition-all ${
                  blocked ? 'bg-red-200 text-red-600' : expired ? 'bg-slate-200 text-slate-400' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                }`}>
                  <i className={`fas ${blocked ? 'fa-ban' : expired ? 'fa-vault' : 'fa-box-archive'} text-lg md:text-2xl`}></i>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <h3 className="text-base md:text-xl font-black text-slate-800 truncate uppercase tracking-tight">{doc.title}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {blocked ? (
                      <span className="text-[7px] md:text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block bg-red-600 text-white shadow-sm shadow-red-600/20">
                        ACCÈS BLOQUÉ
                      </span>
                    ) : (
                      <span 
                        className="text-[7px] md:text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block"
                        style={!expired ? { backgroundColor: '#F2AF31', color: '#643012' } : { backgroundColor: '#e2e8f0', color: '#64748b' }}
                      >
                        {expired ? 'ARCHIVÉ / EXPIRÉ' : 'SECRET D\'ENTREPRISE'}
                      </span>
                    )}
                    {doc.companyName && (
                      <span className="text-[7px] md:text-[8px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase truncate max-w-[120px]">
                        {doc.companyName}
                      </span>
                    )}
                  </div>
                  {doc.summary && (
                    <p className="text-[9px] font-medium text-slate-400 line-clamp-2 uppercase tracking-wide leading-relaxed pt-2">
                      {doc.summary}
                    </p>
                  )}
                  {isAdmin && doc.partnerIds && doc.partnerIds.length > 0 && doc.companyId === currentCompanyId && (
                    <div className="mt-3 pt-3 border-t border-slate-50">
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-1">Partenaires Invités :</span>
                      <div className="flex flex-wrap gap-1">
                        {doc.partnerIds.slice(0, 3).map((email, i) => (
                          <span key={i} className="text-[7px] bg-indigo-50/50 text-indigo-400 border border-indigo-100/30 px-1.5 py-0.5 rounded font-black truncate max-w-full" title={email}>
                            {email}
                          </span>
                        ))}
                        {doc.partnerIds.length > 3 && (
                          <span className="text-[7px] text-slate-300 font-bold">+{doc.partnerIds.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </button>
            </div>
            );
          })
        )}
      </div>

      {selectedDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-200/60 backdrop-blur-2xl animate-fade-in">
          {activeStep === 'WARNING' && (
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 md:p-14 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-slate-100 text-center relative overflow-hidden animate-fade-in-up">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-200 via-amber-500 to-amber-200 opacity-80"></div>
              
              <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                <i className="fas fa-gavel text-3xl"></i>
              </div>
              
              <div className="space-y-4 mb-10 text-center">
                <span className="text-[10px] font-black tracking-[0.3em] text-amber-600 uppercase">Avertissement de Sécurité</span>
                <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                  Responsabilité <br/> Juridique
                </h3>
              </div>
              
              <div className="bg-slate-50/50 p-8 rounded-3xl mb-10 border border-slate-100 text-left">
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-2 h-2 mt-2 rounded-full bg-amber-500 shrink-0"></div>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed">
                      En accédant à ce document, vous reconnaissez que votre <span className="text-slate-900 font-bold">identité, adresse IP et géolocalisation</span> sont enregistrées de manière indélébile dans notre registre de sécurité.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-2 h-2 mt-2 rounded-full bg-amber-500 shrink-0"></div>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed">
                      Toute tentative de fraude, de capture d'écran, de photo par téléphone, d'enregistrement ou de partage non autorisé est <span className="text-slate-900 font-bold">immédiatement détectée</span> et pourra faire et déclenchera une <span className="text-red-600 font-bold">poursuite judiciaire immédiate par Perasafe.</span>
                    </p>
                  </div>
                  <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center">
                    <div className="text-center group">
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-center">AMENDE ENCOURUE :</p>
                      <p className="text-2xl font-black text-red-600 tracking-tight">2.000.000 à 10.000.000 FCFA</p>
                      <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1">SELON LA GRAVITÉ DE LA FUITE</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={resetModal} 
                  className="bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 font-black py-5 rounded-2xl text-[10px] uppercase tracking-widest transition-all border border-transparent hover:border-slate-200"
                >
                  Décliner l'accès
                </button>
                <button 
                  onClick={() => setActiveStep('SIGNATURE')} 
                  className="bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 transition-all transform hover:-translate-y-1"
                >
                  Accepter & Certifier
                </button>
              </div>
              
              <p className="mt-8 text-slate-300 text-[8px] font-bold uppercase tracking-widest">Protocole de sécurité bancaire certifié PERASAFE</p>
            </div>
          )}

          {activeStep === 'SIGNATURE' && (
            <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 md:p-16 shadow-2xl border border-slate-100 text-center animate-fade-in-up">
              <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <PenTool className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-2">Signature de Certification</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Veuillez apposer votre signature manuscrite ci-dessous</p>
              </div>

              <div className="relative mb-10">
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] overflow-hidden group">
                  <SignatureCanvas 
                    ref={sigPad}
                    penColor="#0f172a"
                    canvasProps={{
                      className: "w-full h-64 cursor-crosshair",
                    }}
                    onBegin={() => setIsSigning(true)}
                  />
                  {!isSigning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-30">
                      <div className="w-px h-12 bg-slate-400 mb-2"></div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">Signez ici</span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => { sigPad.current?.clear(); setIsSigning(false); }}
                  className="absolute bottom-4 right-6 text-[9px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                  <X className="w-3 h-3" /> Effacer
                </button>
                {sigError && (
                  <div className="absolute -bottom-10 left-0 right-0 animate-bounce">
                    <p className="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-50 py-2 rounded-lg border border-red-100 shadow-sm">
                      {sigError}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveStep('WARNING')}
                  className="flex-1 bg-slate-100 text-slate-500 font-black py-5 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Précédent
                </button>
                <button 
                  disabled={!isSigning}
                  onClick={handleSignatureConfirm}
                  className="flex-3 bg-indigo-600 text-white font-black py-5 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-[1.02] transition-all disabled:opacity-30 disabled:hover:scale-100"
                >
                  ACCÉDER AU CONTENU SÉCURISÉ
                </button>
              </div>
            </div>
          )}

          {activeStep === 'CONTRACT' && (
            <div className="bg-slate-50 w-full max-w-4xl rounded-[3rem] shadow-2xl border border-slate-200 text-left animate-fade-in-up md:max-h-[85vh] overflow-y-auto overflow-x-hidden custom-scrollbar">
              <div ref={contractRef} className="bg-white p-12 md:p-20 rounded-none border-0 font-serif relative shadow-xl">
                {/* UN-STYLE Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden z-0">
                  <ShieldCheck className="w-[100%] h-[100%] text-slate-900 max-w-full" />
                </div>
                
                {/* Official Header - UN STYLE */}
                <div className="flex flex-col items-center border-b border-slate-300 pb-6 mb-8 relative z-10">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 text-slate-900 flex items-center justify-center border-2 border-slate-900 rounded-full p-3">
                      <ShieldCheck className="w-full h-full" />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <h2 className="text-2xl font-serif text-slate-900 tracking-[0.15em] uppercase font-bold">PERASAFE INTERNATIONAL</h2>
                    <p className="text-[10px] font-sans font-semibold text-slate-500 uppercase tracking-[0.3em]">Protocole de Sécurité & Secret des Affaires</p>
                  </div>
                  <div className="absolute top-0 right-0 text-right hidden md:block">
                    <p className="text-[9px] font-mono text-slate-900 font-bold bg-slate-100 px-2 py-1 inline-block border border-slate-200">PS/CONF/RES/2026/{selectedDoc?.id.substring(0,4).toUpperCase()}</p>
                  </div>
                </div>

                <div className="mb-8 relative z-10 border-l-4 border-slate-900 pl-6">
                  <h1 className="text-xl md:text-2xl font-serif font-black text-slate-900 uppercase tracking-tight leading-tight">
                    Convention Générale de Confidentialité<br/>
                    et de Ratification d'Accès Stratégique
                  </h1>
                  <p className="text-slate-500 font-sans text-[10px] mt-2 uppercase tracking-widest font-bold">Session Spéciale du {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                <div className="space-y-6 text-[13px] text-slate-900 leading-[1.6] text-justify relative z-10">
                  <div>
                    <h4 className="font-sans font-black text-[10px] uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-4">
                      <span>Article Premier</span>
                      <div className="flex-1 h-px bg-slate-100"></div>
                    </h4>
                    <p>
                      La présente Convention lie irrévocablement <strong className="text-slate-900">l'Émetteur {ownerInfo?.companyName ? `« ${ownerInfo?.companyName} »` : 'Responsable'}</strong>, représenté par <strong className="text-slate-900 capitalize">{ownerInfo?.name || 'Le Propriétaire'}</strong>, et le Réceptionnaire habilité <strong className="text-slate-900 uppercase underline decoration-double underline-offset-4">{profile?.name}</strong>. Par la présente, les parties s'engagent à respecter les plus hauts standards de probité et de réserve professionnelle.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-sans font-black text-[10px] uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-4">
                      <span>Article II : Objet du Privilège</span>
                      <div className="flex-1 h-px bg-slate-100"></div>
                    </h4>
                    <p>
                      L'accès au document classifié <strong className="bg-slate-100 px-2 py-0.5 rounded">« {selectedDoc?.title} »</strong> est accordé à titre personnel et non-transmissible. Le Réceptionnaire reconnaît que les informations divulguées constituent un actif immatériel souverain protégé par le Droit International du Secret des Affaires. Cet accès est soumis à une surveillance cryptographique continue exercée par le protocole <strong className="text-indigo-600">PERASafe</strong>.
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
                    name={ownerInfo?.name || 'Validation Requis'} 
                    data={ownerInfo?.signature || ''}
                    roleContext={ownerInfo?.companyName || 'PROPRIÉTAIRE DES DONNÉES'} 
                  />
                  <SignatureDisplay 
                    isFormal
                    title="VISA DU RÉCEPTIONNAIRE" 
                    name={profile?.name || 'Validation Requis'} 
                    data={partnerSignatureData}
                    roleContext={profile?.role === 'PARTNER' ? 'PARTENAIRE HABILITÉ' : 'UTILISATEUR CERTIFIÉ'} 
                  />
                </div>
                
                <div className="mt-16 text-center">
                   <div className="inline-block border-2 border-slate-900 px-6 py-2">
                     <p className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-900">CERTIFIÉ CONFORME PAR PERASAFE</p>
                   </div>
                </div>
              </div>
              
              <div className="contract-actions flex flex-col md:flex-row gap-4 p-8 border-t border-slate-200 bg-white">
                <button 
                  onClick={downloadContract}
                  className="flex-1 bg-white border-2 border-slate-900 text-slate-900 font-black py-5 rounded-2xl text-[10px] md:text-[11px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download className="w-5 h-5" /> TÉLÉCHARGER L'ORIGINAL (PDF)
                </button>
                <button 
                  onClick={() => setActiveStep('CODE')}
                  className="flex-[2] bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl text-[10px] md:text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all transform hover:-translate-y-1 block text-center"
                >
                  ACCEPTER ET ACCÉDER AU CONTENU
                </button>
              </div>
            </div>
          )}

          {activeStep === 'SUCCESS' && (
            <div className="bg-white w-full max-w-xl rounded-[3rem] p-12 md:p-16 shadow-2xl border border-slate-100 text-center animate-fade-in-up">
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="w-24 h-24 bg-green-50 rounded-[2.5rem] flex items-center justify-center animate-pulse">
                    <ShieldCheck className="w-12 h-12 text-green-600" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-6 leading-tight">
                Identification Certifiée, <br/>
                <span className="text-indigo-600">{profile?.name || profile?.onboardingData?.companyName || "Utilisateur"}</span>
              </h3>

              <div className="bg-slate-50 p-8 rounded-[2rem] text-left border border-slate-100 mb-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <ShieldCheck className="w-24 h-24" />
                </div>
                <div className="space-y-4 relative z-10">
                  <p className="text-xs font-bold text-slate-700 leading-relaxed">
                    Votre signature a été enregistrée avec succès. Vous avez certifié avoir pris connaissance des risques et des sanctions encourues.
                  </p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                    En tant qu'utilisateur de PERASafe, vous êtes désormais <span className="text-slate-900">seul responsable</span> de l'intégrité de ce document. Toute fuite, même involontaire, sera tracée jusqu'à votre session.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <button 
                  onClick={() => setActiveStep('CONTRACT')}
                  className="flex-1 bg-white border-2 border-slate-200 text-slate-600 font-black py-6 rounded-2xl text-[11px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" /> VOIR LE CONTRAT
                </button>
                <button 
                  onClick={() => setActiveStep('CODE')}
                  className="flex-[2] bg-slate-900 hover:bg-black text-white font-black py-6 rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-2xl transition-all transform hover:-translate-y-1 block"
                >
                  ACCÉDER AU CONTENU SÉCURISÉ
                </button>
              </div>
            </div>
          )}

          {activeStep === 'CODE' && (
            <div className="bg-white w-full max-w-md rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-16 shadow-2xl border border-slate-100 text-center animate-fade-in-up">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-indigo-600 text-white rounded-2xl md:rounded-[2rem] flex items-center justify-center mx-auto mb-6 md:mb-10 shadow-xl">
                <i className="fas fa-fingerprint text-2xl md:text-4xl"></i>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter mb-4 md:mb-6 uppercase">AUTHENTIFICATION</h3>
              <p className="text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.1em] mb-8 leading-relaxed">
                EN ACCÉDANT À CE DOCUMENT, VOUS VOUS ENGAGEZ À NE JAMAIS DIVULGUER SON CONTENU.
              </p>
              <div className="space-y-6 md:space-y-8">
                <input 
                  type="text"
                  autoFocus
                  value={inputCode}
                  onChange={(e) => { setInputCode(e.target.value); setError(''); }}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl md:rounded-[2rem] py-5 md:py-8 text-center text-3xl md:text-5xl tracking-[0.3em] md:tracking-[0.5em] font-mono focus:border-indigo-600 outline-none text-slate-900 uppercase transition-all"
                  placeholder="••••"
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                />
                {error && <p className="text-red-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest">{error}</p>}
                <div className="flex gap-3 md:gap-4">
                  <button onClick={resetModal} className="flex-1 bg-slate-100 text-slate-600 font-black py-4 md:py-6 rounded-2xl text-[9px] md:text-[10px] uppercase tracking-widest">Abandon</button>
                  <button onClick={handleUnlock} className="flex-1 bg-indigo-600 text-white font-black py-4 md:py-6 rounded-2xl text-[9px] md:text-[10px] uppercase tracking-widest shadow-lg">Extraire</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDocGrid;
