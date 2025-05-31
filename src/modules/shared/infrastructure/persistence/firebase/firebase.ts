import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
    apiKey: "AIzaSyCUDU4n6SvAQBT8qb1R0E_oWvSeJxYu-ro",
    authDomain: "lin-llc.firebaseapp.com",
    projectId: "lin-llc",
    storageBucket: "lin-llc.firebasestorage.app",
    messagingSenderId: "394023041902",
    appId: "1:394023041902:web:f9874be5d0d192557b1f7f",
    measurementId: "G-62JEHK00G8"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

if (typeof window !== "undefined") {
    initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider("YOUR_SITE_KEY"),
        isTokenAutoRefreshEnabled: true,
    });
}

const auth = getAuth(app);
const db = getFirestore(app);

// 重新 export doc, getDoc，讓 context 也能用
export { app, auth, db, doc, getDoc };