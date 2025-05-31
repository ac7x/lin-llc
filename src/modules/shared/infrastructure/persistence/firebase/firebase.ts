import { initializeApp, getApps } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile,
    updatePassword,
    reauthenticateWithCredential,
    sendEmailVerification,
    linkWithCredential,
    unlink,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink,
    connectAuthEmulator,
} from "firebase/auth";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    collection,
    collectionGroup,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    Timestamp, // Import Timestamp class (value and instance type)
    query,
    where,
    orderBy,
    limit,
    startAfter,
    startAt,
    endBefore,
    endAt,
    runTransaction,
    deleteField,
    writeBatch,
    arrayUnion,
    arrayRemove,
    increment,
    serverTimestamp,
    FieldPath,
    GeoPoint,
    setLogLevel as setFirestoreLogLevel,
    connectFirestoreEmulator,
} from "firebase/firestore";
import {
    getStorage,
    ref,
    uploadBytes,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    listAll,
    list,
    getMetadata,
    updateMetadata,
    connectStorageEmulator,
} from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import {
    getAnalytics,
    logEvent,
    setUserId,
    setUserProperties,
    setConsent,
} from "firebase/analytics";
import {
    getPerformance,
    trace,
} from "firebase/performance";
import {
    getMessaging,
    getToken,
    onMessage,
    deleteToken,
    isSupported as isMessagingSupported,
} from "firebase/messaging";
import {
    getRemoteConfig,
    fetchAndActivate,
    getValue,
    getAll,
    setLogLevel as setRemoteConfigLogLevel,
    activate,
} from "firebase/remote-config";
import {
    getFunctions,
    httpsCallable,
    connectFunctionsEmulator,
} from "firebase/functions";

// 型別補齊
import type {
    User,
    UserCredential,
    AuthProvider,
    Auth,
    UserInfo,
    AdditionalUserInfo,
} from "firebase/auth";
import type {
    DocumentData,
    DocumentSnapshot,
    QuerySnapshot,
    QueryDocumentSnapshot,
    Firestore,
    // Timestamp as TimestampType, // REMOVED - Timestamp class will provide its type
    FieldValue,
    Transaction,
    WriteBatch,
    Query,
    DocumentReference,
    CollectionReference,
    FieldPath as FieldPathType, // Keep alias for FieldPath type
    GeoPoint as GeoPointType,   // Keep alias for GeoPoint type
} from "firebase/firestore";
import type {
    FirebaseStorage,
    StorageReference,
    UploadTask,
    UploadTaskSnapshot,
    FullMetadata,
    SettableMetadata,
} from "firebase/storage";
import type {
    Messaging as FirebaseMessaging,
    MessagePayload,
} from "firebase/messaging";
import type {
    Analytics,
} from "firebase/analytics";
import type {
    RemoteConfig,
    Value,
} from "firebase/remote-config";
import type {
    Functions,
    HttpsCallable,
    HttpsCallableResult,
} from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyCUDU4n6SvAQBT8qb1R0E_oWvSeJxYu-ro",
    authDomain: "lin-llc.firebaseapp.com",
    projectId: "lin-llc",
    storageBucket: "lin-llc.appspot.com",
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
// 正確 async 檢查 isMessagingSupported
let messaging: ReturnType<typeof getMessaging> | undefined = undefined;
if (typeof window !== "undefined") {
    isMessagingSupported().then((supported) => {
        if (supported) {
            messaging = getMessaging(app);
        }
    });
}
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
    collectionGroup,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    Timestamp, // Export Timestamp class (value and its instance type)
    query,
    where,
    orderBy,
    limit,
    startAfter,
    startAt,
    endBefore,
    endAt,
    runTransaction,
    getFirestore,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile,
    updatePassword,
    reauthenticateWithCredential,
    sendEmailVerification,
    linkWithCredential,
    unlink,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink,
    connectAuthEmulator,
    // firebase/storage 常用語法
    getStorage,
    ref,
    uploadBytes,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    listAll,
    list,
    getMetadata,
    updateMetadata,
    connectStorageEmulator,
    // firebase/firestore 進階
    deleteField,
    writeBatch,
    arrayUnion,
    arrayRemove,
    increment,
    serverTimestamp,
    FieldPath,
    GeoPoint,
    setFirestoreLogLevel,
    connectFirestoreEmulator,
    // firebase/analytics 常用語法
    analytics,
    getAnalytics,
    logEvent,
    setUserId,
    setUserProperties,
    setConsent,
    // firebase/performance 常用語法
    performance,
    getPerformance,
    trace,
    // firebase/messaging 常用語法
    messaging,
    getMessaging,
    getToken,
    onMessage,
    deleteToken,
    isMessagingSupported,
    // firebase/remote-config 常用語法
    remoteConfig,
    getRemoteConfig,
    fetchAndActivate,
    getValue,
    getAll,
    setRemoteConfigLogLevel,
    activate,
    // firebase/functions 常用語法
    functions,
    getFunctions,
    httpsCallable,
    connectFunctionsEmulator,
};

// 型別 export 必須用 export type
export type {
    User,
    UserCredential,
    AuthProvider,
    Auth,
    UserInfo,
    AdditionalUserInfo,
    DocumentData,
    DocumentSnapshot,
    QuerySnapshot,
    QueryDocumentSnapshot,
    Firestore,
    Timestamp as TimestampType, // 只 export 型別，避免重複
    FieldValue,
    Transaction,
    WriteBatch,
    Query,
    DocumentReference,
    CollectionReference,
    FieldPathType, // Export aliased FieldPath type
    GeoPointType,  // Export aliased GeoPoint type
    FirebaseStorage as Storage,
    StorageReference,
    UploadTask,
    UploadTaskSnapshot,
    FullMetadata,
    SettableMetadata,
    FirebaseMessaging,
    MessagePayload,
    Analytics,
    RemoteConfig,
    Value,
    Functions,
    HttpsCallable,
    HttpsCallableResult,
};