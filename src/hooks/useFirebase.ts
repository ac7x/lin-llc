"use client";

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import {
  subscribeToAuthState,
  initializeFirebaseAppCheck,
  auth, // 新增匯入
  signOut, // 新增匯入
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from '@/lib/firebase-client';

// 定義 FirebaseAuth 回傳型別
interface FirebaseAuthReturn {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isReady: boolean;
  db: Firestore;
  // Firestore 功能
  collection: typeof collection;
  doc: typeof doc;
  getDoc: typeof getDoc;
  getDocs: typeof getDocs;
  setDoc: typeof setDoc;
  updateDoc: typeof updateDoc;
  deleteDoc: typeof deleteDoc;
  query: typeof query;
  where: typeof where;
  orderBy: typeof orderBy;
  limit: typeof limit;
  Timestamp: typeof Timestamp;
}

export function useAuth(): FirebaseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // 初始化 App Check
    const initAppCheck = async () => {
      try {
        await initializeFirebaseAppCheck();
        setInitialized(true);
      } catch (error) {
        console.error('App Check 初始化失敗:', error);
        setInitialized(true); // 即使失敗也要繼續
      }
    };

    initAppCheck();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const unsubscribe = subscribeToAuthState((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, [initialized]);

  return {
    user,
    loading: loading || !initialized,
    isAuthenticated: !!user,
    isInitialized: initialized,
    isReady: initialized && !loading,
    db,
    // Firestore 功能
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
  };
}

/**
 * Firebase App Check 狀態 hook
 */
export function useAppCheck() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initAppCheck = async () => {
      try {
        await initializeFirebaseAppCheck();
        setInitialized(true);
      } catch (err) {
        setError(err as Error);
        console.error('App Check 初始化失敗:', err);
      }
    };

    initAppCheck();
  }, []);

  return { initialized, error };
}

/**
 * 組合 hook - 提供完整的 Firebase 狀態
 */
interface FirebaseReturn extends FirebaseAuthReturn {
  appCheck: {
    initialized: boolean;
    error: Error | null;
  };
}

export function useFirebase(): FirebaseReturn {
  const auth = useAuth();
  const appCheck = useAppCheck();

  return {
    ...auth,
    appCheck,
    isReady: auth.isInitialized && appCheck.initialized
  };
}

// 重新導出所需的 Firebase 功能
export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  db,
  auth, // 新增匯出
  signOut // 新增匯出
};