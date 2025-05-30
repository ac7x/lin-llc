import { initializeAppCheck, ReCaptchaEnterpriseProvider, CustomProvider } from "firebase/app-check";
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

// Custom Provider 版本
export function initCustomAppCheck(app: FirebaseApp, getTokenFromServer: () => Promise<{ token: string, expireTimeMillis: number }>) {
    if (typeof window === "undefined") return;
    if (isAppCheckInitialized) return;
    const appCheckCustomProvider = new CustomProvider({
        getToken: async () => {
            const { token, expireTimeMillis } = await getTokenFromServer();
            return { token, expireTimeMillis };
        }
    });
    initializeAppCheck(app, {
        provider: appCheckCustomProvider,
        isTokenAutoRefreshEnabled: true,
    });
    isAppCheckInitialized = true;
}
