"use client";

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import {
  subscribeToAuthState,
  initializeFirebaseAppCheck,
  auth,
  signOut,
  db,
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
import { firebaseService } from '../lib/services/firebase.service';
import { authUtils } from '../lib/utils/firebase-auth.utils';
import { firestoreUtils } from '../lib/utils/firebase-firestore.utils';

// 導出 react-firebase-hooks
export { 
  useCollection,
  useDocument 
} from 'react-firebase-hooks/firestore';

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
export function useFirebase() {
  return {
    auth: firebaseService.getAuth(),
    db: firebaseService.getDb(),
    ...authUtils,
    ...firestoreUtils,
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