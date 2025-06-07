import { getAnalytics, isSupported, logEvent, Analytics } from "firebase/analytics";
import { firebaseApp } from "./firebase-client";
import { getAppCheckToken } from "./firebase-appcheck";

/**
 * 初始化 Firebase Analytics，確保 App Check 已驗證且僅於瀏覽器端執行
 */
let analyticsInstance: Analytics | null = null;

export async function initializeAnalytics(): Promise<Analytics | null> {
  if (analyticsInstance) return analyticsInstance;
  if (typeof window === "undefined") return null;

  // 確保 App Check 已初始化並取得有效 token
  const appCheckToken = await getAppCheckToken();
  if (!appCheckToken) {
    // 若 App Check 尚未就緒，拒絕初始化 Analytics
    throw new Error("App Check token is not available. Analytics initialization aborted.");
  }

  const supported = await isSupported();
  if (supported) {
    analyticsInstance = getAnalytics(firebaseApp);
    return analyticsInstance;
  }
  return null;
}

/**
 * 代理 logEvent，需先初始化 Analytics
 */
export async function logAnalyticsEvent(
  eventName: string,
  eventParams?: Record<string, unknown>
): Promise<void> {
  const analytics = await initializeAnalytics();
  if (analytics) {
    logEvent(analytics, eventName, eventParams);
  }
}