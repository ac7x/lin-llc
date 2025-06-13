"use client";

import { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import type { AppUser } from '@/types/user';
import { ROLE_HIERARCHY } from '@/utils/roleHierarchy';
import {
  initializeFirebaseAppCheck,
  auth,
  signOut,
  db,
  firebaseApp,
  // Firestore core
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  // Queries
  query,
  where,
  orderBy,
  limit,
  // Utils
  Timestamp,
  serverTimestamp,
  // Array operations
  arrayUnion,
  arrayRemove,
} from '@/lib/firebase-client';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';

// 導出 react-firebase-hooks
export { 
  useCollection,
  useDocument 
} from 'react-firebase-hooks/firestore';

const ROLE_CHECKS = {
  owner: 'isOwner',
  admin: 'isAdmin',
  finance: 'isFinance',
  user: 'isUser',
  helper: 'isHelper',
  temporary: 'isTemporary',
  coord: 'isCoord',
  safety: 'isSafety',
  foreman: 'isForeman',
  vendor: 'isVendor'
} as const;

// 定義 FirebaseAuth 回傳型別
interface FirebaseAuthReturn {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isReady: boolean;
  db: Firestore;
  auth: typeof auth;
  // Firestore 功能
  collection: typeof collection;
  doc: typeof doc;
  getDoc: typeof getDoc;
  getDocs: typeof getDocs;
  addDoc: typeof addDoc;
  setDoc: typeof setDoc;
  updateDoc: typeof updateDoc;
  deleteDoc: typeof deleteDoc;
  // Queries
  query: typeof query;
  where: typeof where;
  orderBy: typeof orderBy;
  limit: typeof limit;
  // Utils
  Timestamp: typeof Timestamp;
  serverTimestamp: typeof serverTimestamp;
  // Array operations
  arrayUnion: typeof arrayUnion;
  arrayRemove: typeof arrayRemove;
}

interface UseUserRoleReturn {
  userRole: string | undefined;
  userRoles: string[];
  loading: boolean;
  error: Error | undefined;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasMinRole: (minRole: string) => boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isFinance: boolean;
  isUser: boolean;
  isHelper: boolean;
  isTemporary: boolean;
  isCoord: boolean;
  isSafety: boolean;
  isForeman: boolean;
  isVendor: boolean;
}

interface AuthReturn extends FirebaseAuthReturn, UseUserRoleReturn {
  appCheck: {
    initialized: boolean;
    error: Error | null;
    isInitializing: boolean;
  };
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [appCheckError, setAppCheckError] = useState<Error | null>(null);
  const auth = getAuth(firebaseApp);

  // 獲取用戶角色相關數據
  const [userDoc, roleLoading, roleError] = useDocument(
    user ? doc(db, 'users', user.uid) : null
  );

  const userRole = useMemo(() => {
    const userData = userDoc?.data() as AppUser | undefined;
    return userData?.role;
  }, [userDoc]);

  const userRoles = useMemo(() => {
    const userData = userDoc?.data() as AppUser | undefined;
    return (userData?.roles || [userData?.role])
      .filter((role): role is string => role !== undefined);
  }, [userDoc]);

  const hasRole = useMemo(() => (role: string): boolean => {
    return userRole === role;
  }, [userRole]);

  const hasAnyRole = useMemo(() => (roles: string[]): boolean => {
    return userRoles.some(role => role !== undefined && roles.includes(role));
  }, [userRoles]);

  const hasMinRole = useMemo(() => (minRole: string): boolean => {
    if (!userRole) return false;
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const minLevel = ROLE_HIERARCHY[minRole] || 0;
    return userLevel >= minLevel;
  }, [userRole]);

  const roleChecks = useMemo(() => {
    const checks = {
      isOwner: false,
      isAdmin: false,
      isFinance: false,
      isUser: false,
      isHelper: false,
      isTemporary: false,
      isCoord: false,
      isSafety: false,
      isForeman: false,
      isVendor: false
    };
    
    Object.entries(ROLE_CHECKS).forEach(([role, propertyName]) => {
      checks[propertyName as keyof typeof checks] = hasRole(role);
    });
    
    return checks;
  }, [hasRole]);

  useEffect(() => {
    // 初始化 App Check
    const initAppCheck = async () => {
      try {
        await initializeFirebaseAppCheck();
        setInitialized(true);
      } catch (error) {
        console.error('App Check 初始化失敗:', error);
        setAppCheckError(error as Error);
        setInitialized(true); // 即使失敗也要繼續
      }
    };

    initAppCheck();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [initialized, auth]);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      throw error;
    }
  };

  return {
    user,
    loading: loading || !initialized || roleLoading,
    isAuthenticated: !!user,
    isInitialized: initialized,
    isReady: initialized && !loading && !roleLoading,
    db,
    auth,
    // Firestore 功能
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    // Queries
    query,
    where,
    orderBy,
    limit,
    // Utils
    Timestamp,
    serverTimestamp,
    // Array operations
    arrayUnion,
    arrayRemove,
    // User Role 功能
    userRole,
    userRoles,
    error: roleError,
    hasRole,
    hasAnyRole,
    hasMinRole,
    ...roleChecks,
    // App Check
    appCheck: {
      initialized,
      error: appCheckError,
      isInitializing: false
    },
    signIn,
    signOut
  };
}

// 重新導出所需的 Firebase 功能
export {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  db,
  auth,
  signOut
}; 