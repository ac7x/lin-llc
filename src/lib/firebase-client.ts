/**
 * Firebase 客戶端初始化與核心功能
 * 提供 Firebase 服務的初始化設定
 * 包含身份驗證、資料庫操作、Storage 和 App Check 功能
 * 管理 Firebase 實例和狀態監聽
 */

// firebase.ts
import { initializeApp, FirebaseApp } from 'firebase/app'; // 引入 FirebaseApp 型別
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
  User,
  signInWithPopup,
  getIdToken,
} from 'firebase/auth';
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
  Firestore, // 引入 Firestore 型別
  DocumentData, // 引入 DocumentData 型別
  DocumentReference, // 引入 DocumentReference 型別
} from 'firebase/firestore';
import {
  getStorage,
  FirebaseStorage, // 保留型別定義
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import { getRemoteConfig, RemoteConfig } from 'firebase/remote-config';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  getToken,
  AppCheck, // 新增：引入 AppCheck 型別
} from 'firebase/app-check';
import { firebaseConfig, APP_CHECK_CONFIG, FIREBASE_EMULATOR } from './firebase-config'; // 假設這些配置存在

// --- Firebase 應用程式初始化 ---
const app: FirebaseApp = initializeApp(firebaseConfig);
const firebaseApp: FirebaseApp = app;

// --- 服務實例初始化（伺服器端安全） ---
const auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// --- 客戶端專用服務初始化 ---
let analytics: Analytics | null = null;
let performance: any = null;
let remoteConfig: RemoteConfig | null = null;
let appCheck: AppCheck | null = null;

// 檢查是否在瀏覽器環境中
const isClient = typeof window !== 'undefined';

// 只在客戶端初始化需要 navigator 的服務
if (isClient) {
  try {
    analytics = getAnalytics(app);
    performance = getPerformance(app);
    remoteConfig = getRemoteConfig(app);

    // App Check 初始化
    appCheck = initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaV3Provider(APP_CHECK_CONFIG.SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    console.warn('Firebase 客戶端服務初始化失敗:', error);
  }
}

/**
 * 取得 App Check token（僅客戶端）
 */
export async function getAppCheckToken(): Promise<string | null> {
  if (!isClient || !appCheck) {
    console.warn('App Check 僅在客戶端可用');
    return null;
  }

  try {
    const tokenResult = await getToken(appCheck);
    return tokenResult.token;
  } catch (error) {
    console.error('取得 App Check token 失敗:', error);
    throw error;
  }
}

/**
 * 取得 Analytics 實例（僅客戶端）
 */
export function getAnalyticsInstance(): Analytics | null {
  return analytics;
}

/**
 * 取得 Performance 實例（僅客戶端）
 */
export function getPerformanceInstance(): any {
  return performance;
}

/**
 * 取得 Remote Config 實例（僅客戶端）
 */
export function getRemoteConfigInstance(): RemoteConfig | null {
  return remoteConfig;
}

/**
 * 取得 App Check 實例（僅客戶端）
 */
export function getAppCheckInstance(): AppCheck | null {
  return appCheck;
}

// 匯出需要的 Firebase 函數和類別
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
  // Storage 相關函數
  ref,
  uploadBytesResumable,
  getDownloadURL,
};

export type { User };

// 匯出 Firestore 相關函數
export {
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

// 匯出 Firebase 服務實例
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
