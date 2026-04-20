
/**
 * PERADoc Strategic Security Processor
 * Chiffrement symétrique de haut niveau pour documents confidentiels.
 */

const SYSTEM_SALT = "PERAFIND_SECURE_NODE_X14_SALT_2025";

/**
 * Transforme le contenu en ciphertext illisible.
 * Utilise la clé d'accès comme pivot de chiffrement.
 */
export const encryptContent = (content: string, key: string): string => {
  if (!content || !key) return content;
  
  try {
    const fullKey = key + SYSTEM_SALT;
    const contentBytes = new TextEncoder().encode(content);
    const keyBytes = new TextEncoder().encode(fullKey);
    const keyLen = keyBytes.length;
    
    // Phase 1 : XOR Cipher itératif optimisé
    const encrypted = new Uint8Array(contentBytes.length);
    for (let i = 0; i < contentBytes.length; i++) {
      encrypted[i] = contentBytes[i] ^ keyBytes[i % keyLen];
    }
    
    // Phase 2 : Obfuscation Base64
    const binString = String.fromCodePoint(...encrypted);
    const base64 = btoa(binString);
    
    // Phase 3 : Signature et inversion
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
    console.warn("Decryption error : Clé invalide ou données corrompues.");
    return "ERREUR DE DÉCHIFFREMENT : Le contenu est protégé ou corrompu.";
  }
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
