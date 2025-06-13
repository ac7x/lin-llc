// firebase.ts
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  getRedirectResult,
  User
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAt,
  startAfter,
  endAt,
  endBefore,
  onSnapshot,
  writeBatch,
  runTransaction,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider, getToken } from 'firebase/app-check';
import { firebaseConfig } from './firebase-config';

const app = initializeApp(firebaseConfig);
export const firebaseApp = app;
export const auth = getAuth(app);
export const db = getFirestore(app);

let appCheck: ReturnType<typeof initializeAppCheck> | null = null;

// 新增重試機制
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1秒

async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryOperation(operation, retries - 1);
    }
    throw error;
  }
}

/**
 * 初始化 Firebase App Check
 */
export async function initializeFirebaseAppCheck(): Promise<void> {
  if (typeof window === 'undefined' || appCheck) {
    return;
  }

  return retryOperation(async () => {
    try {
      appCheck = initializeAppCheck(firebaseApp, {
        provider: new ReCaptchaV3Provider('6LepxlYrAAAAAMxGh5307zIOJHz1PKrVDgZHgKwg'),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (error) {
      console.error('App Check initialization failed:', error);
      throw error;
    }
  });
}

/**
 * 取得 App Check token
 */
export async function getAppCheckToken(): Promise<string | null> {
  if (!appCheck) {
    await initializeFirebaseAppCheck();
  }
  
  return retryOperation(async () => {
    try {
      const tokenResult = await getToken(appCheck!);
      return tokenResult.token;
    } catch (error) {
      console.error('Failed to get App Check token:', error);
      return null;
    }
  });
}

/**
 * 檢查 App Check 是否已初始化
 */
export function isAppCheckInitialized(): boolean {
  return appCheck !== null;
}

// 更新：auth 狀態管理型別與處理器，確保 User 型別已導入
type AuthStateHandler = (user: User | null) => void;
const authStateHandlers = new Set<AuthStateHandler>();

// 新增：自動初始化 AppCheck
initializeFirebaseAppCheck().catch(console.error);

/**
 * 訂閱 auth 狀態變更
 */
export function subscribeToAuthState(handler: AuthStateHandler): () => void {
  authStateHandlers.add(handler);
  // 立即提供當前狀態
  handler(auth.currentUser);
  
  return () => {
    authStateHandlers.delete(handler);
  };
}

// 初始化 auth 狀態監聽
onAuthStateChanged(auth, (user) => {
  authStateHandlers.forEach(handler => handler(user));
});

// Re-export Firebase 功能
export {
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  getRedirectResult,
  // Firestore
  collection,
  doc,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAt,
  startAfter,
  endAt,
  endBefore,
  onSnapshot,
  writeBatch,
  runTransaction,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
};
