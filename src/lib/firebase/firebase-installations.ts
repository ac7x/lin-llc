import { getInstallations, getId as getInstallationId, Installations } from "firebase/installations";
import { firebaseApp } from "./firebase-client";
import { getAppCheckToken } from "./firebase-appcheck";

/**
 * 初始化 Firebase Installations，確保 App Check 已驗證且僅於瀏覽器端執行
 */
let installationsInstance: Installations | null = null;

export async function initializeInstallations(): Promise<Installations | null> {
  if (installationsInstance) return installationsInstance;
  if (typeof window === "undefined") return null;

  const appCheckToken = await getAppCheckToken();
  if (!appCheckToken) {
    throw new Error("App Check token is not available. Installations initialization aborted.");
  }

  installationsInstance = getInstallations(firebaseApp);
  return installationsInstance;
}

/**
 * 取得 Firebase Installation ID
 */
export async function getFirebaseInstallationId(): Promise<string | null> {
  const installations = await initializeInstallations();
  if (!installations) return null;
  return await getInstallationId(installations);
}