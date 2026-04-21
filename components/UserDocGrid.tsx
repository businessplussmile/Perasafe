
import React, { useState, useRef } from 'react';
import { SecureDocument } from '../types';

interface UserDocGridProps {
  documents: SecureDocument[];
  onOpenDoc: (doc: SecureDocument, code: string) => void;
  isAdmin?: boolean;
  onDeleteDoc?: (id: string) => void;
  onImportDocuments?: (docs: SecureDocument[]) => void;
}

const SIGNATURE = "PERADOC-SIG-X14";

const UserDocGrid: React.FC<UserDocGridProps> = ({ documents, onOpenDoc, isAdmin, onDeleteDoc, onImportDocuments }) => {
  const [selectedDoc, setSelectedDoc] = useState<SecureDocument | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocuments = React.useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const query = searchQuery.toLowerCase().trim();
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(query) || 
      (doc.summary && doc.summary.toLowerCase().includes(query))
    );
  }, [documents, searchQuery]);

  const handleUnlock = () => {
    if (!selectedDoc) return;
    if (inputCode === selectedDoc.accessCode) {
      if (selectedDoc.isConsumed) {
        setError("Accès révoqué définitivement.");
        return;
      }
      onOpenDoc(selectedDoc, inputCode);
      setSelectedDoc(null);
      setInputCode('');
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
        setTimeout(() => alert(`Succès de l'injection.`), 300);
      } catch (err) {
        alert("Fichier non reconnu.");
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
              placeholder="RECHERCHER PAR TITRE OU RÉSUMÉ..."
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
              <span className="text-xl md:text-2xl font-black text-slate-900">{documents.filter(d => !d.isConsumed).length}</span>
            </div>
            <div className="flex-1 sm:flex-none bg-slate-100 px-5 md:px-6 py-3 md:py-4 rounded-2xl border border-slate-200 flex flex-col min-w-[100px] md:min-w-[120px]">
              <span className="text-slate-400 text-[8px] md:text-[9px] font-black uppercase tracking-widest mb-0.5">Archives</span>
              <span className="text-xl md:text-2xl font-black text-slate-400">{documents.filter(d => d.isConsumed).length}</span>
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
          filteredDocuments.map(doc => (
            <div 
              key={doc.id}
              className={`group relative rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 transition-all duration-500 border-2 ${
                doc.isConsumed 
                  ? 'bg-slate-50 border-slate-100 cursor-not-allowed grayscale opacity-50' 
                  : 'bg-white border-white hover:border-indigo-600/30 cursor-pointer shadow-md hover:shadow-xl'
              }`}
            >
              {isAdmin && onDeleteDoc && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteDoc(doc.id); }}
                  className="absolute top-4 right-4 md:top-6 md:right-6 w-9 h-9 md:w-10 md:h-10 rounded-xl bg-red-50 text-red-500 sm:opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white z-10 flex items-center justify-center btn-active"
                >
                  <i className="fas fa-trash-can text-[10px] md:text-xs"></i>
                </button>
              )}

              <div 
                onClick={() => !doc.isConsumed && setSelectedDoc(doc)}
                className="relative h-full"
              >
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center mb-5 md:mb-10 transition-all ${
                  doc.isConsumed ? 'bg-slate-200 text-slate-400' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                }`}>
                  <i className={`fas ${doc.isConsumed ? 'fa-vault' : 'fa-box-archive'} text-lg md:text-2xl`}></i>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <h3 className="text-base md:text-xl font-black text-slate-800 truncate uppercase tracking-tight">{doc.title}</h3>
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-[7px] md:text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block"
                      style={!doc.isConsumed ? { backgroundColor: '#F2AF31', color: '#643012' } : { backgroundColor: '#e2e8f0', color: '#64748b' }}
                    >
                      {doc.isConsumed ? 'ARCHIVÉ' : 'SECRET D\'ENTREPRISE'}
                    </span>
                  </div>
                  {doc.summary && (
                    <p className="text-[9px] font-medium text-slate-400 line-clamp-2 uppercase tracking-wide leading-relaxed pt-2">
                      {doc.summary}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-100/70 backdrop-blur-xl animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-16 shadow-2xl border border-slate-100 text-center">
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
                <button onClick={() => { setSelectedDoc(null); setInputCode(''); }} className="flex-1 bg-slate-100 text-slate-600 font-black py-4 md:py-6 rounded-2xl text-[9px] md:text-[10px] uppercase tracking-widest">Abandon</button>
                <button onClick={handleUnlock} className="flex-1 bg-indigo-600 text-white font-black py-4 md:py-6 rounded-2xl text-[9px] md:text-[10px] uppercase tracking-widest shadow-lg">Extraire</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDocGrid;
