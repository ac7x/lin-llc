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

interface UserData {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  lastLoginAt: string;
  rolePermissions: RolePermissions;
  currentRole: RoleKey;
}

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<void> => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await getIdToken(result.user);

      // 檢查用戶是否已存在於數據庫
      const userRef = doc(db, 'members', result.user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // 如果是新用戶，創建用戶文檔
        const userData: UserData = {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          rolePermissions: createInitialRolePermissions(),
          currentRole: 'guest',
        };
        await setDoc(userRef, userData);
      } else {
        // 更新最後登入時間
        await setDoc(userRef, {
          lastLoginAt: new Date().toISOString(),
        }, { merge: true });
      }

      console.log('登入成功，ID Token:', idToken);
    } catch (err) {
      console.error('登入失敗:', err);
      setError('登入過程中發生錯誤，請稍後再試');
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    signInWithGoogle,
  };
};
