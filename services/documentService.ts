
/**
 * PERADoc Strategic Security Processor - INTERNAL ENGINE (No External AI)
 * Chiffrement symétrique et analyse heuristique locale.
 */

const SYSTEM_SALT = "PERAFIND_SECURE_NODE_X14_SALT_2025";

/**
 * Transforme le contenu en ciphertext illisible.
 */
export const encryptContent = (content: string, key: string): string => {
  if (!content || !key) return content;
  
  try {
    const fullKey = key + SYSTEM_SALT;
    const contentBytes = new TextEncoder().encode(content);
    const keyBytes = new TextEncoder().encode(fullKey);
    const keyLen = keyBytes.length;
    
    const encrypted = new Uint8Array(contentBytes.length);
    for (let i = 0; i < contentBytes.length; i++) {
      encrypted[i] = contentBytes[i] ^ keyBytes[i % keyLen];
    }
    
    const binString = String.fromCodePoint(...encrypted);
    const base64 = btoa(binString);
    
    return `SECUREV1:${base64.split('').reverse().join('')}`;
  } catch (e) {
    console.error("Encryption failure", e);
    return content;
  }
};

/**
 * Restaure le contenu original à partir du ciphertext.
 */
export const decryptContent = (ciphertext: string, key: string): string => {
  if (!ciphertext || !key || !ciphertext.startsWith("SECUREV1:")) return ciphertext;
  
  try {
    const fullKey = key + SYSTEM_SALT;
    const rawData = ciphertext.replace("SECUREV1:", "").split('').reverse().join('');
    
    const binString = atob(rawData);
    const encrypted = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
    const keyBytes = new TextEncoder().encode(fullKey);
    const keyLen = keyBytes.length;
    
    const decrypted = new Uint8Array(encrypted.length);
    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ keyBytes[i % keyLen];
    }
    
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.warn("Decryption error : Clé invalide.");
    return "ERREUR DE DÉCHIFFREMENT : Le contenu est protégé ou corrompu.";
  }
};

/**
 * Analyse heuristique interne du document (Remplacement de l'IA par un moteur local)
 */
export const summarizeDocument = async (content: string): Promise<string> => {
  if (!content || content.length < 10) return "Contenu trop court pour analyse.";

  const text = content.trim();
  const wordCount = text.split(/\s+/).length;
  const sentenceCount = text.split(/[.!?]+/).length - 1;
  
  // Extraction des points clés par fréquence ou position (Version déterministe)
  const lines = text.split('\n').filter(l => l.trim().length > 15);
  const coreContext = lines.length > 0 ? lines[0].substring(0, 100).trim() : text.substring(0, 100).trim();

  let type = "Texte brut";
  if (text.startsWith("{") || text.startsWith("[")) type = "Structure JSON";
  if (text.includes("<?xml") || text.includes("<html")) type = "Balises XML/HTML";
  if (text.includes(";") && lines.some(l => l.includes(";"))) type = "Données Tabulaires (CSV)";

  return `Indexation Interne : ${type} identifié. Volume : ${wordCount} mots répartis en ${sentenceCount} segments. Amorce contextuelle : "${coreContext}..."`;
};

export const getFileMetadata = (fileName: string, fileSize: number) => {
  return {
    name: fileName,
    size: (fileSize / 1024).toFixed(2) + " KB",
    timestamp: new Date().toISOString()
  };
};

export const processLocalDocument = (content: string): string => {
  return content.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, "");
};
