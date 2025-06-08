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
  getRedirectResult
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

export const firebaseConfig = {
    apiKey: "AIzaSyCUDU4n6SvAQBT8qb1R0E_oWvSeJxYu-ro",
    authDomain: "lin-llc.firebaseapp.com",
    projectId: "lin-llc",
    storageBucket: "lin-llc.appspot.com",
    messagingSenderId: "394023041902",
    appId: "1:394023041902:web:f9874be5d0d192557b1f7f",
    measurementId: "G-62JEHK00G8",
};

export const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY || '6LepxlYrAAAAAMxGh5307zIOJHz1PKrVDgZHgKwg';

const app = initializeApp(firebaseConfig);

export const firebaseApp = app;
export const auth = getAuth(app);
export const db = getFirestore(app);

let appCheck: ReturnType<typeof initializeAppCheck> | null = null;

/**
 * 初始化 Firebase App Check
 */
export function initializeFirebaseAppCheck(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    if (appCheck) {
      resolve();
      return;
    }

    try {
      appCheck = initializeAppCheck(firebaseApp, {
        provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 取得 App Check token
 */
export async function getAppCheckToken(): Promise<string | null> {
  if (!appCheck) return null;

  try {
    const tokenResult = await getToken(appCheck);
    return tokenResult.token;
  } catch {
    return null;
  }
}

/**
 * 檢查 App Check 是否已初始化
 */
export function isAppCheckInitialized(): boolean {
  return appCheck !== null;
}

// Auth 相關的 exports
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
