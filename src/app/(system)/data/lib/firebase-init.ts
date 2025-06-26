import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck } from 'firebase/app-check';
import { firebaseConfig, APP_CHECK_CONFIG } from './firebase-config';

// 初始化 Firebase 應用
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 初始化服務
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics（僅在瀏覽器環境且支援時初始化）
export let analytics: ReturnType<typeof getAnalytics> | null = null;

// App Check 實例
export let appCheck: AppCheck | null = null;

// 服務初始化狀態
let servicesInitialized = false;

/**
 * 初始化客戶端服務
 * 包括 Analytics 和 Emulator 連接（開發環境）
 */
export async function initializeClientServices(): Promise<void> {
  if (servicesInitialized || typeof window === 'undefined') {
    return;
  }

  try {
    // 初始化 Analytics（如果支援）
    if (await isSupported()) {
      analytics = getAnalytics(app);
    }

    // 初始化 App Check
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(APP_CHECK_CONFIG.SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });

    // 開發環境連接 Emulator
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      try {
        // 檢查是否已經連接過 emulator（避免重複連接）
        const authEmulator = auth as unknown as { _delegate?: { config?: { emulator?: boolean } } };
        const dbEmulator = db as unknown as { _delegate?: { _databaseId?: { projectId?: string } } };
        const isAuthEmulatorConnected = authEmulator._delegate?.config?.emulator;
        const isFirestoreEmulatorConnected = dbEmulator._delegate?._databaseId?.projectId?.includes('demo-');
        
        if (!isAuthEmulatorConnected) {
          connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        }
        
        if (!isFirestoreEmulatorConnected) {
          connectFirestoreEmulator(db, 'localhost', 8080);
        }
        
        connectStorageEmulator(storage, 'localhost', 9199);
        
        console.log('🔧 Firebase Emulator 已連接');
      } catch (error) {
        console.warn('Firebase Emulator 連接失敗（可能已連接）:', error);
      }
    }

    servicesInitialized = true;
    console.log('✅ Firebase 客戶端服務已初始化');
  } catch (error) {
    console.error('❌ Firebase 客戶端服務初始化失敗:', error);
    throw error;
  }
}

/**
 * 獲取 Firebase 應用實例
 */
export function getFirebaseApp() {
  return app;
}

/**
 * 檢查 Firebase 服務是否已初始化
 */
export function isFirebaseInitialized(): boolean {
  return getApps().length > 0;
}

/**
 * 獲取 Firebase 配置
 */
export function getFirebaseConfig() {
  return firebaseConfig;
}

/**
 * 檢查是否在 Emulator 環境
 */
export function isEmulatorEnvironment(): boolean {
  return process.env.NODE_ENV === 'development' && 
         process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
}

/**
 * 獲取 App Check 實例，如果未初始化則先初始化
 */
export async function getAppCheck(): Promise<AppCheck | null> {
  if (typeof window === 'undefined') return null;
  
  if (!servicesInitialized) {
    await initializeClientServices();
  }
  
  return appCheck;
}

/**
 * 同步獲取 App Check 實例（僅在已初始化的情況下）
 */
export function getAppCheckSync(): AppCheck | null {
  return appCheck;
}

// 重新導出配置常數，便於統一導出
export { firebaseConfig, RECAPTCHA_CONFIG, APP_CHECK_CONFIG, GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_MAP_ID } from './firebase-config';

// 默認導出主要服務
const firebaseServices = {
  app,
  auth,
  db,
  storage,
  analytics,
  appCheck,
  initializeClientServices,
  getAppCheck,
  getAppCheckSync,
  isFirebaseInitialized,
  getFirebaseConfig,
  isEmulatorEnvironment,
};

export default firebaseServices; 