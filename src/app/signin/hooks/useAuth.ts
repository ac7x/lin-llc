import { useState, useEffect } from 'react';
import { 
  auth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  getIdToken,
  onAuthStateChanged,
  type User
} from '@/lib/firebase-client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { type RoleKey, ROLE_HIERARCHY } from '@/constants/roles';

type RolePermissions = {
  [K in RoleKey]: boolean;
};

interface MemberData {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  lastLoginAt: string;
  rolePermissions: RolePermissions;
  currentRole: RoleKey;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface UseAuthReturn extends AuthState {
  signInWithGoogle: () => Promise<void>;
}

const createInitialRolePermissions = (): RolePermissions => {
  const permissions = {} as RolePermissions;
  (Object.keys(ROLE_HIERARCHY) as RoleKey[]).forEach((role) => {
    permissions[role] = role === 'guest';
  });
  return permissions;
};

export const useAuth = (): UseAuthReturn => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setAuthState(prev => ({
        ...prev,
        user: currentUser,
        loading: false
      }));
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, error: null }));
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await getIdToken(result.user);

      const memberRef = doc(db, 'members', result.user.uid);
      const memberDoc = await getDoc(memberRef);

      if (!memberDoc.exists()) {
        const memberData: MemberData = {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          rolePermissions: createInitialRolePermissions(),
          currentRole: 'guest',
        };
        await setDoc(memberRef, memberData);
      } else {
        await setDoc(memberRef, {
          lastLoginAt: new Date().toISOString(),
        }, { merge: true });
      }

      console.log('登入成功，ID Token:', idToken);
    } catch (err) {
      console.error('登入失敗:', err);
      setAuthState(prev => ({
        ...prev,
        error: '登入過程中發生錯誤，請稍後再試'
      }));
      throw err;
    }
  };

  return {
    ...authState,
    signInWithGoogle,
  };
};
