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
import { firebaseConfig, APP_CHECK_CONFIG } from './firebase-config';

const app = initializeApp(firebaseConfig);
export const firebaseApp = app;
export const auth = getAuth(app);
export const db = getFirestore(app);

let appCheck: ReturnType<typeof initializeAppCheck> | null = null;
let appCheckInitialized = false;
let appCheckError: Error | null = null;

/**
 * 初始化 Firebase App Check
 */
export async function initializeFirebaseAppCheck(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  if (appCheckInitialized) {
    if (appCheckError) {
      throw appCheckError;
    }
    return;
  }

  try {
    appCheck = initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaV3Provider(APP_CHECK_CONFIG.SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
    appCheckInitialized = true;
    appCheckError = null;
  } catch (error) {
    console.error('App Check 初始化失敗:', error);
    appCheckError = error as Error;
    throw error;
  }
}

/**
 * 取得 App Check token
 */
export async function getAppCheckToken(): Promise<string | null> {
  if (!appCheckInitialized) {
    await initializeFirebaseAppCheck();
  }
  
  if (appCheckError) {
    throw appCheckError;
  }
  
  try {
    const tokenResult = await getToken(appCheck!);
    return tokenResult.token;
  } catch (error) {
    console.error('取得 App Check token 失敗:', error);
    return null;
  }
}

/**
 * 檢查 App Check 是否已初始化
 */
export function isAppCheckInitialized(): boolean {
  return appCheckInitialized && !appCheckError;
}

/**
 * 取得 App Check 狀態
 */
export function getAppCheckStatus(): {
  initialized: boolean;
  error: Error | null;
} {
  return {
    initialized: appCheckInitialized,
    error: appCheckError
  };
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
