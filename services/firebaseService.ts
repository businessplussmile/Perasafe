import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Erreur d'authentification Google:", error);
    throw error;
  }
};

export const signOut = () => auth.signOut();

export interface UserProfile {
  uid: string;
  email: string;
  role: 'ADMIN' | 'COMPANY_OWNER' | 'PARTNER';
  companyId?: string;
  name?: string;
  createdAt: number;
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  return null;
};

export const createUserProfile = async (profile: UserProfile) => {
  const userRef = doc(db, 'users', profile.uid);
  await setDoc(userRef, {
    ...profile,
    createdAt: Date.now() // Matching rules looking for number
  });
};

// Test connection strictly during initial boot
async function testConnection() {
  try {
    // We try to get a non-existent doc to check connection
    await getDocFromServer(doc(db, '_internal_', 'connection_test'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or internet connection.");
    } else {
      // Missing permissions on this path is expected and means we ARE connected
      console.log("Firebase connection established.");
    }
  }
}
testConnection();
