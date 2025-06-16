import { useEffect, useState } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  type User,
  GoogleAuthProvider,
  signInWithPopup,
  getIdToken,
  db,
  doc,
  setDoc,
  getDoc
} from '@/lib/firebase-client';
import { ROLE_NAMES } from '@/constants/roles';

type RoleKey = keyof typeof ROLE_NAMES;

type UserRoles = Record<RoleKey, boolean>;

interface UserData {
  email: string;
  displayName: string;
  photoURL: string | null;
  roles: UserRoles;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthState {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const createInitialUserData = (user: User): UserData => {
  const roles = Object.keys(ROLE_NAMES).reduce<UserRoles>((acc, role) => {
    acc[role as RoleKey] = role === 'guest';
    return acc;
  }, {} as UserRoles);

  return {
    email: user.email || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL,
    roles,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

export function useAuth(): AuthState & AuthActions {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async (currentUser: User) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (!userDoc.exists()) {
        // 如果是新用戶，創建初始用戶資料
        const initialUserData = createInitialUserData(currentUser);
        await setDoc(doc(db, 'users', currentUser.uid), initialUserData);
        setUserData(initialUserData);
      } else {
        setUserData(userDoc.data() as UserData);
      }
    } catch (err) {
      console.error('獲取用戶資料失敗:', err);
      setError('獲取用戶資料時發生錯誤');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<void> => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await getIdToken(result.user);
    } catch (err) {
      console.error('登入失敗:', err);
      setError('登入過程中發生錯誤，請稍後再試');
      throw err;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error('登出失敗:', err);
      setError('登出過程中發生錯誤，請稍後再試');
      throw err;
    }
  };

  return {
    user,
    userData,
    loading,
    error,
    signInWithGoogle,
    signOut
  };
}
