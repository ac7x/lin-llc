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
import { getAnalytics, Analytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import { getRemoteConfig, RemoteConfig } from 'firebase/remote-config';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  getToken,
  AppCheck, // 新增：引入 AppCheck 型別
} from 'firebase/app-check';
import { firebaseConfig, APP_CHECK_CONFIG, FIREBASE_EMULATOR } from './firebase-config'; // 假設這些配置存在
import { getErrorMessage, logError, safeAsync, retry } from '@/utils/errorUtils';

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
let performance: ReturnType<typeof getPerformance> | null = null;
let remoteConfig: RemoteConfig | null = null;
let appCheck: AppCheck | null = null;

// 檢查是否在瀏覽器環境中
const isClient = typeof window !== 'undefined';

// 只在客戶端初始化需要 navigator 的服務
if (isClient) {
  safeAsync(async () => {
    // Analytics 初始化
    try {
      const analyticsSupported = await isAnalyticsSupported();
      if (analyticsSupported) {
        analytics = getAnalytics(app);
      }
    } catch (error) {
      logError(error, { operation: 'initialize_analytics' });
    }
    
    // Performance 初始化，添加更嚴格的錯誤處理
    try {
      // 檢查是否支援 Performance API
      if ('performance' in window && typeof window.performance.mark === 'function') {
        performance = getPerformance(app);
      } else {
        console.warn('Firebase Performance: 瀏覽器不支援 Performance API');
      }
    } catch (error) {
      // 如果 Performance 初始化失敗，記錄錯誤但不中斷應用
      logError(error, { operation: 'initialize_performance' });
      performance = null;
    }
    
    // Remote Config 初始化
    try {
      remoteConfig = getRemoteConfig(app);
    } catch (error) {
      logError(error, { operation: 'initialize_remote_config' });
    }

    // App Check 初始化
    try {
      appCheck = initializeAppCheck(firebaseApp, {
        provider: new ReCaptchaV3Provider(APP_CHECK_CONFIG.SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (error) {
      logError(error, { operation: 'initialize_app_check' });
    }
  }, (error) => {
    logError(error, { operation: 'initialize_client_services' });
    // 不拋出錯誤，讓應用繼續運行
  });
}

/**
 * 取得 App Check token（僅客戶端）
 */
export async function getAppCheckToken(): Promise<string | null> {
  if (!isClient || !appCheck) {
    return null;
  }

  return await safeAsync(async () => {
    const tokenResult = await retry(() => getToken(appCheck!), 3, 1000);
    return tokenResult.token;
  }, (error) => {
    logError(error, { operation: 'get_app_check_token' });
    return null;
  });
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
export function getPerformanceInstance(): ReturnType<typeof getPerformance> | null {
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

// 匯出型別定義
export type {
  Firestore,
  DocumentData,
  DocumentReference,
  FirebaseStorage,
  Functions,
  Analytics,
  RemoteConfig,
  AppCheck,
};

/**
 * 測試 App Check 功能
 */
export async function testAppCheck(): Promise<boolean> {
  if (!isClient) {
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
