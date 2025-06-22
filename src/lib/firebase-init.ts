// src/lib/firebase-init.ts
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import { getRemoteConfig } from 'firebase/remote-config';
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck } from 'firebase/app-check';
import { getStorage } from 'firebase/storage';
import { logError } from '@/utils/errorUtils';
import { firebaseConfig, APP_CHECK_CONFIG } from './firebase-config';

// Firebase 應用程式初始化
const app: FirebaseApp = initializeApp(firebaseConfig);

// 服務實例初始化（伺服器端安全）
const auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// 客戶端專用服務初始化
let analytics: ReturnType<typeof getAnalytics> | null = null;
let performance: ReturnType<typeof getPerformance> | null = null;
let remoteConfig: ReturnType<typeof getRemoteConfig> | null = null;
let appCheck: AppCheck | null = null;

/**
 * 初始化客戶端專用服務
 */
export const initializeClientServices = async (): Promise<void> => {
  if (typeof window === 'undefined') return; // 不在客戶端環境中

  try {
    // Analytics 初始化
    const analyticsSupported = await isAnalyticsSupported();
    if (analyticsSupported) {
      analytics = getAnalytics(app);
    }

    // Performance 初始化
    if ('performance' in window) {
      performance = getPerformance(app);
    }

    // Remote Config 初始化
    remoteConfig = getRemoteConfig(app);

    // App Check 初始化
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(APP_CHECK_CONFIG.SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    logError(error, { operation: 'initialize_client_services' });
  }
};

// 匯出服務實例
export {
  app as firebaseApp,
  auth,
  db,
  storage,
  functions,
  analytics,
  performance,
  remoteConfig,
  appCheck,
};

// 命名變數後再導出
const firebaseClientServices = {
  initializeClientServices,
};

export default firebaseClientServices;