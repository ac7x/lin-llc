import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, onSnapshot } from "firebase/firestore";
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
        provider: new ReCaptchaV3Provider("6Leykk4rAAAAAE8l-TYIU-N42B4fkl4bBBVWYibE"),
        isTokenAutoRefreshEnabled: true,
    });
}

const auth = getAuth(app);
const db = getFirestore(app);

// 重新 export 需要用到的 firebase 方法與物件
export {
    app,
    auth,
    db,
    doc,
    getDoc,
    setDoc,
    collection,
    onSnapshot,
    getFirestore,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    signOut,
};