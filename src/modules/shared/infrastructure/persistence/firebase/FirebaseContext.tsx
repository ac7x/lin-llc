"use client";
import React, { createContext, useContext } from "react";
import {
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
    Timestamp, // Value import
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
    // analytics
    analytics,
    getAnalytics,
    logEvent,
    setUserId,
    setUserProperties,
    setConsent,
    // performance
    performance,
    getPerformance,
    trace,
    // messaging
    messaging,
    getMessaging,
    getToken,
    onMessage,
    deleteToken,
    isMessagingSupported,
    // remote-config
    remoteConfig,
    getRemoteConfig,
    fetchAndActivate,
    getValue,
    getAll,
    setRemoteConfigLogLevel,
    activate,
    // functions
    functions,
    getFunctions,
    httpsCallable,
    connectFunctionsEmulator,
} from "./firebase";
import type {
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
    Timestamp as TimestampType, // Type import (instance type of Timestamp class)
    FieldValue,
    Transaction,
    WriteBatch,
    Query,
    DocumentReference,
    CollectionReference,
    Storage, // This was aliased as FirebaseStorage in firebase.ts, ensure consistency
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
    FieldPathType, // Import aliased FieldPathType
    GeoPointType,  // Import aliased GeoPointType
} from "./firebase"; // Corrected: Timestamp is now directly imported as a type
import {
    useCollection,
    useCollectionData,
    useCollectionOnce,
    useCollectionDataOnce,
    useDocument,
    useDocumentData,
    useDocumentOnce,
    useDocumentDataOnce,
} from "react-firebase-hooks/firestore";
import {
    useAuthState,
    useCreateUserWithEmailAndPassword,
    useSignInWithEmailAndPassword,
    useSignOut,
    useSendPasswordResetEmail,
    useUpdateProfile,
    useUpdatePassword,
    useSendEmailVerification,
    useSignInWithEmailLink,
} from "react-firebase-hooks/auth";
import {
    useUploadFile,
    useDownloadURL,
} from "react-firebase-hooks/storage";
import {
    useToken,
} from "react-firebase-hooks/messaging";

type FirebaseContextType = {
    app: typeof app;
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
    Timestamp: typeof Timestamp; // This refers to the Timestamp class/constructor
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
    connectAuthEmulator: typeof connectAuthEmulator;
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
    connectStorageEmulator: typeof connectStorageEmulator;
    deleteField: typeof deleteField;
    writeBatch: typeof writeBatch;
    arrayUnion: typeof arrayUnion;
    arrayRemove: typeof arrayRemove;
    increment: typeof increment;
    serverTimestamp: typeof serverTimestamp;
    FieldPath: typeof FieldPath;
    GeoPoint: typeof GeoPoint;
    setFirestoreLogLevel: typeof setFirestoreLogLevel;
    connectFirestoreEmulator: typeof connectFirestoreEmulator;
    // analytics
    analytics: typeof analytics;
    getAnalytics: typeof getAnalytics;
    logEvent: typeof logEvent;
    setUserId: typeof setUserId;
    setUserProperties: typeof setUserProperties;
    setConsent: typeof setConsent;
    // performance
    performance: typeof performance;
    getPerformance: typeof getPerformance;
    trace: typeof trace;
    // messaging
    messaging: typeof messaging;
    getMessaging: typeof getMessaging;
    getToken: typeof getToken;
    onMessage: typeof onMessage;
    deleteToken: typeof deleteToken;
    isMessagingSupported: typeof isMessagingSupported;
    // remote-config
    remoteConfig: typeof remoteConfig;
    getRemoteConfig: typeof getRemoteConfig;
    fetchAndActivate: typeof fetchAndActivate;
    getValue: typeof getValue;
    getAll: typeof getAll;
    setRemoteConfigLogLevel: typeof setRemoteConfigLogLevel;
    activate: typeof activate;
    // functions
    functions: typeof functions;
    getFunctions: typeof getFunctions;
    httpsCallable: typeof httpsCallable;
    connectFunctionsEmulator: typeof connectFunctionsEmulator;
    // firestore hooks
    useCollection: typeof useCollection;
    useCollectionData: typeof useCollectionData;
    useCollectionOnce: typeof useCollectionOnce;
    useCollectionDataOnce: typeof useCollectionDataOnce;
    useDocument: typeof useDocument;
    useDocumentData: typeof useDocumentData;
    useDocumentOnce: typeof useDocumentOnce;
    useDocumentDataOnce: typeof useDocumentDataOnce;
    // auth hooks
    useAuthState: typeof useAuthState;
    useCreateUserWithEmailAndPassword: typeof useCreateUserWithEmailAndPassword;
    useSignInWithEmailAndPassword: typeof useSignInWithEmailAndPassword;
    useSignOut: typeof useSignOut;
    useSendPasswordResetEmail: typeof useSendPasswordResetEmail;
    useUpdateProfile: typeof useUpdateProfile;
    useUpdatePassword: typeof useUpdatePassword;
    useSendEmailVerification: typeof useSendEmailVerification;
    useSignInWithEmailLink: typeof useSignInWithEmailLink;
    // storage hooks
    useUploadFile: typeof useUploadFile;
    useDownloadURL: typeof useDownloadURL;
    // messaging hooks
    useToken: typeof useToken;
    // Types that might be used with the context values
    // These are illustrative, actual usage dictates what's needed here
    // For example, if you pass a function that returns a User, you might want User type here
    // User: User; // This would be the type, not typeof User
};

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <FirebaseContext.Provider
            value={{
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
                connectAuthEmulator,
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
                // analytics
                analytics,
                getAnalytics,
                logEvent,
                setUserId,
                setUserProperties,
                setConsent,
                // performance
                performance,
                getPerformance,
                trace,
                // messaging
                messaging,
                getMessaging,
                getToken,
                onMessage,
                deleteToken,
                isMessagingSupported,
                // remote-config
                remoteConfig,
                getRemoteConfig,
                fetchAndActivate,
                getValue,
                getAll,
                setRemoteConfigLogLevel,
                activate,
                // functions
                functions,
                getFunctions,
                httpsCallable,
                connectFunctionsEmulator,
                // firestore hooks
                useCollection,
                useCollectionData,
                useCollectionOnce,
                useCollectionDataOnce,
                useDocument,
                useDocumentData,
                useDocumentOnce,
                useDocumentDataOnce,
                // auth hooks
                useAuthState,
                useCreateUserWithEmailAndPassword,
                useSignInWithEmailAndPassword,
                useSignOut,
                useSendPasswordResetEmail,
                useUpdateProfile,
                useUpdatePassword,
                useSendEmailVerification,
                useSignInWithEmailLink,
                // storage hooks
                useUploadFile,
                useDownloadURL,
                // messaging hooks
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

// Re-export types for convenience if needed by consumers of useFirebase()
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
    TimestampType as Timestamp, // Instance type
    FieldValue,
    Transaction,
    WriteBatch,
    Query,
    DocumentReference,
    CollectionReference,
    Storage,
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
    FieldPathType,
    GeoPointType,
};