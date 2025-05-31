import { initializeApp, getApps } from "firebase/app";
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

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = isBrowser ? getAnalytics(app) : undefined;

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
};
