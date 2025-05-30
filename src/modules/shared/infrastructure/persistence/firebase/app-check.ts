import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { FirebaseApp } from "firebase/app";

let isAppCheckInitialized = false;

export function initAppCheck(app: FirebaseApp, siteKey: string) {
    if (typeof window === "undefined") return; // 僅在瀏覽器端執行
    if (isAppCheckInitialized) return;
    initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(siteKey),
        isTokenAutoRefreshEnabled: true,
    });
    isAppCheckInitialized = true;
}
