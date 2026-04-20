import { useState, useEffect } from 'react';
import { auth, getUserProfile, createUserProfile, UserProfile, db } from '../services/firebaseService';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        let userProfile = await getUserProfile(firebaseUser.uid);
        
        if (!userProfile) {
          // Si le profil n'existe pas, on le crée (Onboarding)
          const companyId = `company_${firebaseUser.uid}`;
          userProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: 'COMPANY_OWNER',
            companyId: companyId,
            name: firebaseUser.displayName || '',
            createdAt: Date.now()
          };
          
          await createUserProfile(userProfile);
          
          // Créer la compagnie associée
          await setDoc(doc(db, 'companies', companyId), {
            id: companyId,
            name: `Espace de ${firebaseUser.displayName || firebaseUser.email}`,
            ownerId: firebaseUser.uid,
            subscriptionStatus: 'ACTIVE',
            subscriptionTier: 'PREMIUM', // On offre le premium pour le sérieux du travail ;)
            createdAt: Date.now()
          });
        }
        setProfile(userProfile);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, profile, loading };
}
