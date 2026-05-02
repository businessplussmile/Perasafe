
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseService';
import { UserProfile, SecureDocument } from '../types';

export type AlertType = 'SCREENSHOT_ATTEMPT' | 'PHONE_DETECTED' | 'BLUR_LOSS' | 'CLIPBOARD_COPY' | 'AUDIO_SCREENSHOT_DETECTED';

export const logSecurityAlert = async (
  type: AlertType,
  document: SecureDocument,
  readerProfile: UserProfile
) => {
  if (!readerProfile || !document) return;

  try {
    const alertsRef = collection(db, 'companies', document.companyId, 'securityAlerts');
    
    await addDoc(alertsRef, {
      type,
      documentId: document.id,
      documentTitle: document.title,
      companyId: document.companyId,
      ownerId: document.uploaderId,
      readerEmail: readerProfile.email,
      readerUid: readerProfile.uid,
      timestamp: Date.now(),
      details: `${type} detected for user ${readerProfile.email} while viewing "${document.title}"`
    });

    console.log(`Security alert logged: ${type} for ${readerProfile.email}`);
  } catch (error) {
    console.error("Error logging security alert:", error);
  }
};
