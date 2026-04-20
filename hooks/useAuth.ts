import { useState, useEffect } from 'react';
import { auth, getUserProfile, createUserProfile, db } from '../services/firebaseService';
import { UserProfile } from '../types';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Listener temps réel sur le profil
        const userRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeProfile = onSnapshot(userRef, async (snap) => {
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            const isAdmin = firebaseUser.email === 'jorisahoussi4@gmail.com';
            
            if (isAdmin && (data.role !== 'ADMIN' || !data.onboardingCompleted)) {
              // On force le mode ADMIN pour le propriétaire de l'app
              setProfile({ ...data, role: 'ADMIN', onboardingCompleted: true, subscriptionStatus: 'ACTIVE' });
            } else {
              setProfile(data);
            }
            setLoading(false);
          } else {
            // Création initiale (Onboarding)
            const companyId = `company_${firebaseUser.uid}`;
            const isAdmin = firebaseUser.email === 'jorisahoussi4@gmail.com';
            
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: isAdmin ? 'ADMIN' : 'COMPANY_OWNER',
              companyId: isAdmin ? undefined : companyId,
              subscriptionTier: 'STANDARD',
              subscriptionStatus: isAdmin ? 'ACTIVE' : 'NONE',
              onboardingCompleted: isAdmin, // Admins bypass onboarding
              name: firebaseUser.displayName || '',
              createdAt: Date.now()
            };
            
            await createUserProfile(newProfile);
            
            if (!isAdmin) {
              await setDoc(doc(db, 'companies', companyId), {
                id: companyId,
                name: `Espace de ${firebaseUser.displayName || firebaseUser.email}`,
                ownerId: firebaseUser.uid,
                subscriptionStatus: 'ACTIVE',
                subscriptionTier: 'STANDARD',
                createdAt: Date.now()
              });
            }
            // Le snapshot se redéclenchera après le setDoc (via createUserProfile)
          }
        });
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
        if (unsubscribeProfile) unsubscribeProfile();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  return { user, profile, loading };
}
