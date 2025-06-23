/**
 * Firebase 客戶端功能與操作
 * 提供 Firebase 服務的操作函數與型別定義
 * 所有服務實例由 firebase-init.ts 提供
 */

// 從 firebase-init.ts 導入服務實例
import {
  firebaseApp,
  auth,
  db,
  storage,
  functions,
  analytics,
  performance,
  remoteConfig,
  appCheck,
} from './firebase-init';

// Firebase 身份驗證相關函數與型別
import {
  GoogleAuthProvider,
  signInWithPopup,
  getIdToken,
  onAuthStateChanged,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  getRedirectResult,
  User,
} from 'firebase/auth';

// Firestore 相關函數與型別
import {
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
  Firestore,
  DocumentData,
  DocumentReference,
} from 'firebase/firestore';

// Storage 相關函數與型別
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  FirebaseStorage,
} from 'firebase/storage';

// Functions 相關型別
import { Functions } from 'firebase/functions';

// Analytics 相關型別
import { Analytics } from 'firebase/analytics';

// Remote Config 相關型別
import { RemoteConfig } from 'firebase/remote-config';

// App Check 相關型別
import { AppCheck, getToken, AppCheckTokenResult } from 'firebase/app-check';

// 錯誤處理工具
import { getErrorMessage, logError, safeAsync, retry } from '@/utils/errorUtils';

/**
 * 取得 App Check token（僅客戶端）
 */
export async function getAppCheckToken(): Promise<string | null> {
  if (typeof window === 'undefined' || !appCheck) {
    return null;
  }

  return await safeAsync(async () => {
    const tokenResult: AppCheckTokenResult = await retry(() => getToken(appCheck!), 3, 1000);
    return tokenResult.token;
  }, (error) => {
    logError(error, { operation: 'get_app_check_token' });
    return null;
  });
}

/**
 * 測試 App Check 功能
 */
export async function testAppCheck(): Promise<boolean> {
  if (typeof window === 'undefined') {
    console.warn('testAppCheck: 不在客戶端環境中');
    return false;
  }

  try {
    const token = await getAppCheckToken();
    if (token) {
      console.log('App Check 測試成功，token 長度:', token.length);
      return true;
    } else {
      console.error('App Check 測試失敗：無法獲取 token');
      return false;
    }
  } catch (error) {
    console.error('App Check 測試失敗:', error);
    return false;
  }
}

// 匯出 Firebase 操作函數
export {
  GoogleAuthProvider,
  signInWithPopup,
  getIdToken,
  onAuthStateChanged,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  getRedirectResult,
  ref,
  uploadBytesResumable,
  getDownloadURL,
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

// 匯出型別定義
export type {
  User,
  Firestore,
  DocumentData,
  DocumentReference,
  FirebaseStorage,
  Functions,
  Analytics,
  RemoteConfig,
  AppCheck,
};

// 匯出服務實例（可選，若其他檔案需要直接使用）
export {
  firebaseApp,
  auth,
  db,
  storage,
  functions,
  analytics,
  performance,
  remoteConfig,
  appCheck,
};