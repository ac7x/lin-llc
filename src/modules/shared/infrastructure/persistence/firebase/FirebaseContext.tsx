"use client";
import React, { createContext, useContext } from "react";
import { initializeApp, getApps } from "firebase/app";
// 匯入 App Check 相關模組
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import {
    getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged,
    createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile,
    updatePassword, reauthenticateWithCredential, sendEmailVerification, linkWithCredential, unlink,
    sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink
} from "firebase/auth";
import {
    getFirestore, doc, getDoc, setDoc, collection, collectionGroup, getDocs, addDoc, updateDoc, deleteDoc,
    onSnapshot, Timestamp, query, where, orderBy, limit, startAfter, startAt, endBefore, endAt, runTransaction,
    deleteField, writeBatch, arrayUnion, arrayRemove, increment, serverTimestamp, FieldPath, GeoPoint,
    setLogLevel as setFirestoreLogLevel
} from "firebase/firestore";
import {
    getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject, listAll, list,
    getMetadata, updateMetadata
} from "firebase/storage";
import { getAnalytics, logEvent } from "firebase/analytics";
import type {
    User, UserCredential, AuthProvider, Auth, UserInfo, AdditionalUserInfo
} from "firebase/auth";
import type {
    DocumentData, DocumentSnapshot, QuerySnapshot, QueryDocumentSnapshot, Firestore, FieldValue, Transaction,
    WriteBatch, Query, DocumentReference, CollectionReference, FieldPath as FieldPathType, GeoPoint as GeoPointType
} from "firebase/firestore";
import type {
    FirebaseStorage, StorageReference, UploadTask, UploadTaskSnapshot, FullMetadata, SettableMetadata
} from "firebase/storage";
import type { Analytics } from "firebase/analytics";
// 匯入 App Check 型別
import type { AppCheck } from "firebase/app-check";
import {
    useCollection, useCollectionData, useCollectionOnce, useCollectionDataOnce, useDocument, useDocumentData,
    useDocumentOnce, useDocumentDataOnce,
} from "react-firebase-hooks/firestore";
import {
    useAuthState, useCreateUserWithEmailAndPassword, useSignInWithEmailAndPassword, useSignOut,
    useSendPasswordResetEmail, useUpdateProfile, useUpdatePassword, useSendEmailVerification, useSignInWithEmailLink,
} from "react-firebase-hooks/auth";
import { useUploadFile, useDownloadURL } from "react-firebase-hooks/storage";
import { useToken } from "react-firebase-hooks/messaging";

// Firebase 初始化
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
const isBrowser = typeof window !== "undefined";

// 初始化 App Check
// 將 'YOUR_RECAPTCHA_V3_SITE_KEY' 替換成您的 reCAPTCHA v3 網站金鑰
// 重要：確保此金鑰與您在 Firebase 控制台中設定的金鑰相符。
// 您提供的金鑰：6Leykk4rAAAAAE8l-TYIU-N42B4fkl4bBBVWYibE
// 將 isTokenAutoRefreshEnabled 設為 true 以便自動刷新 token
let appCheck: AppCheck | undefined = undefined;
if (isBrowser) {
    appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider('6Leykk4rAAAAAE8l-TYIU-N42B4fkl4bBBVWYibE'),
        isTokenAutoRefreshEnabled: true
    });
}


const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = isBrowser ? getAnalytics(app) : undefined;

type FirebaseContextType = {
    app: typeof app;
    appCheck: typeof appCheck; // 加入 appCheck 型別
    auth: typeof auth;
    db: typeof db;
    storage: typeof storage;
    doc: typeof doc;
    getDoc: typeof getDoc;
    setDoc: typeof setDoc;
    collection: typeof collection;
    collectionGroup: typeof collectionGroup;
    getDocs: typeof getDocs;
    addDoc: typeof addDoc;
    updateDoc: typeof updateDoc;
    deleteDoc: typeof deleteDoc;
    onSnapshot: typeof onSnapshot;
    Timestamp: typeof Timestamp;
    query: typeof query;
    where: typeof where;
    orderBy: typeof orderBy;
    limit: typeof limit;
    startAfter: typeof startAfter;
    startAt: typeof startAt;
    endBefore: typeof endBefore;
    endAt: typeof endAt;
    runTransaction: typeof runTransaction;
    getFirestore: typeof getFirestore;
    GoogleAuthProvider: typeof GoogleAuthProvider;
    signInWithPopup: typeof signInWithPopup;
    signInWithRedirect: typeof signInWithRedirect;
    signOut: typeof signOut;
    onAuthStateChanged: typeof onAuthStateChanged;
    createUserWithEmailAndPassword: typeof createUserWithEmailAndPassword;
    signInWithEmailAndPassword: typeof signInWithEmailAndPassword;
    sendPasswordResetEmail: typeof sendPasswordResetEmail;
    updateProfile: typeof updateProfile;
    updatePassword: typeof updatePassword;
    reauthenticateWithCredential: typeof reauthenticateWithCredential;
    sendEmailVerification: typeof sendEmailVerification;
    linkWithCredential: typeof linkWithCredential;
    unlink: typeof unlink;
    sendSignInLinkToEmail: typeof sendSignInLinkToEmail;
    isSignInWithEmailLink: typeof isSignInWithEmailLink;
    signInWithEmailLink: typeof signInWithEmailLink;
    getStorage: typeof getStorage;
    ref: typeof ref;
    uploadBytes: typeof uploadBytes;
    uploadBytesResumable: typeof uploadBytesResumable;
    getDownloadURL: typeof getDownloadURL;
    deleteObject: typeof deleteObject;
    listAll: typeof listAll;
    list: typeof list;
    getMetadata: typeof getMetadata;
    updateMetadata: typeof updateMetadata;
    deleteField: typeof deleteField;
    writeBatch: typeof writeBatch;
    arrayUnion: typeof arrayUnion;
    arrayRemove: typeof arrayRemove;
    increment: typeof increment;
    serverTimestamp: typeof serverTimestamp;
    FieldPath: typeof FieldPath;
    GeoPoint: typeof GeoPoint;
    setFirestoreLogLevel: typeof setFirestoreLogLevel;
    analytics: typeof analytics;
    getAnalytics: typeof getAnalytics;
    logEvent: typeof logEvent;
    useCollection: typeof useCollection;
    useCollectionData: typeof useCollectionData;
    useCollectionOnce: typeof useCollectionOnce;
    useCollectionDataOnce: typeof useCollectionDataOnce;
    useDocument: typeof useDocument;
    useDocumentData: typeof useDocumentData;
    useDocumentOnce: typeof useDocumentOnce;
    useDocumentDataOnce: typeof useDocumentDataOnce;
    useAuthState: typeof useAuthState;
    useCreateUserWithEmailAndPassword: typeof useCreateUserWithEmailAndPassword;
    useSignInWithEmailAndPassword: typeof useSignInWithEmailAndPassword;
    useSignOut: typeof useSignOut;
    useSendPasswordResetEmail: typeof useSendPasswordResetEmail;
    useUpdateProfile: typeof useUpdateProfile;
    useUpdatePassword: typeof useUpdatePassword;
    useSendEmailVerification: typeof useSendEmailVerification;
    useSignInWithEmailLink: typeof useSignInWithEmailLink;
    useUploadFile: typeof useUploadFile;
    useDownloadURL: typeof useDownloadURL;
    useToken: typeof useToken;
};

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <FirebaseContext.Provider
            value={{
                app,
                appCheck, // 加入 appCheck 實例
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
                Timestamp,
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
                deleteField,
                writeBatch,
                arrayUnion,
                arrayRemove,
                increment,
                serverTimestamp,
                FieldPath,
                GeoPoint,
                setFirestoreLogLevel,
                analytics,
                getAnalytics,
                logEvent,
                useCollection,
                useCollectionData,
                useCollectionOnce,
                useCollectionDataOnce,
                useDocument,
                useDocumentData,
                useDocumentOnce,
                useDocumentDataOnce,
                useAuthState,
                useCreateUserWithEmailAndPassword,
                useSignInWithEmailAndPassword,
                useSignOut,
                useSendPasswordResetEmail,
                useUpdateProfile,
                useUpdatePassword,
                useSendEmailVerification,
                useSignInWithEmailLink,
                useUploadFile,
                useDownloadURL,
                useToken,
            }}
        >
            {children}
        </FirebaseContext.Provider>
    );
};

export const useFirebase = () => {
    const context = useContext(FirebaseContext);
    if (!context) {
        throw new Error("useFirebase must be used within a FirebaseProvider");
    }
    return context;
};

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
    Timestamp as TimestampType,
    FieldValue,
    Transaction,
    WriteBatch,
    Query,
    DocumentReference,
    CollectionReference,
    FieldPathType,
    GeoPointType,
    FirebaseStorage,
    StorageReference,
    UploadTask,
    UploadTaskSnapshot,
    FullMetadata,
    SettableMetadata,
    Analytics,
    AppCheck, // 匯出 AppCheck 型別
};