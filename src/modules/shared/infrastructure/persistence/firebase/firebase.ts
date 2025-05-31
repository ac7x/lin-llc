import { initializeApp, getApps } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    signOut,
    onAuthStateChanged,
} from "firebase/auth";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    onSnapshot,
    Timestamp,
    query,
    type QuerySnapshot,
    type DocumentData,
} from "firebase/firestore";
import {
    getStorage,
    ref,
    uploadBytes,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    listAll,
} from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import {
    getAnalytics,
    logEvent,
    setUserId,
    setUserProperties,
    setCurrentScreen,
} from "firebase/analytics";
import {
    getPerformance,
    trace,
} from "firebase/performance";
import {
    getMessaging,
    getToken,
    onMessage,
} from "firebase/messaging";
import {
    getRemoteConfig,
    fetchAndActivate,
    getValue,
    setLogLevel,
} from "firebase/remote-config";
import {
    getFunctions,
    httpsCallable,
    connectFunctionsEmulator,
} from "firebase/functions";

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
const storage = getStorage(app);

// Analytics、Performance、Messaging、Remote Config、Functions 只在瀏覽器端初始化
const analytics = typeof window !== "undefined" ? getAnalytics(app) : undefined;
const performance = typeof window !== "undefined" ? getPerformance(app) : undefined;
const messaging = typeof window !== "undefined" ? getMessaging(app) : undefined;
const remoteConfig = typeof window !== "undefined" ? getRemoteConfig(app) : undefined;
const functions = typeof window !== "undefined" ? getFunctions(app) : undefined;

export {
    app,
    auth,
    db,
    storage,
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    onSnapshot,
    Timestamp,
    query,
    getFirestore,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    signOut,
    onAuthStateChanged,
    // firebase/storage 常用語法
    getStorage,
    ref,
    uploadBytes,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    listAll,
    // firebase/analytics 常用語法
    analytics,
    getAnalytics,
    logEvent,
    setUserId,
    setUserProperties,
    setCurrentScreen,
    // firebase/performance 常用語法
    performance,
    getPerformance,
    trace,
    // firebase/messaging 常用語法
    messaging,
    getMessaging,
    getToken,
    onMessage,
    // firebase/remote-config 常用語法
    remoteConfig,
    getRemoteConfig,
    fetchAndActivate,
    getValue,
    setLogLevel,
    // firebase/functions 常用語法
    functions,
    getFunctions,
    httpsCallable,
    connectFunctionsEmulator,
};
// 型別 export 必須用 export type
export type { QuerySnapshot, DocumentData };