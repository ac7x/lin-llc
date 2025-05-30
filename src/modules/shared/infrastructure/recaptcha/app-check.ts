import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import type { FirebaseApp } from "firebase/app";
import { loadRecaptchaScript } from "./recaptcha-script";

// siteKey 可選，預設自動從環境變數取得
export async function initializeAppCheckIfNeeded(app: FirebaseApp, siteKey?: string) {
    const key = siteKey || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!key) throw new Error("reCAPTCHA site key 未設定，請檢查環境變數 NEXT_PUBLIC_RECAPTCHA_SITE_KEY");
    // 只初始化一次
    const anyApp = app as FirebaseApp & { _isinitializeAppCheckCalled?: boolean };
    if (anyApp._isinitializeAppCheckCalled) return;
    if (typeof window !== "undefined") {
        await loadRecaptchaScript(key);
    }
    initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(key),
        isTokenAutoRefreshEnabled: true,
    });
    anyApp._isinitializeAppCheckCalled = true;
    if (typeof window !== "undefined") {
        console.log("Firebase App Check initialized.");
    }
}
