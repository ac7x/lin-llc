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
    getStorage,
    ref,
    uploadBytes,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    listAll,
    // analytics
    analytics,
    getAnalytics,
    logEvent,
    setUserId,
    setUserProperties,
    setCurrentScreen,
    // performance
    performance,
    getPerformance,
    trace,
    // messaging
    messaging,
    getMessaging,
    getToken,
    onMessage,
    // remote-config
    remoteConfig,
    getRemoteConfig,
    fetchAndActivate,
    getValue,
    setLogLevel,
    // functions
    functions,
    getFunctions,
    httpsCallable,
    connectFunctionsEmulator,
} from "./firebase";
import type { QuerySnapshot, DocumentData } from "./firebase";
import { useCollection } from "react-firebase-hooks/firestore";

type FirebaseContextType = {
    app: typeof app;
    auth: typeof auth;
    db: typeof db;
    storage: typeof storage;
    doc: typeof doc;
    getDoc: typeof getDoc;
    setDoc: typeof setDoc;
    collection: typeof collection;
    getDocs: typeof getDocs;
    addDoc: typeof addDoc;
    updateDoc: typeof updateDoc;
    onSnapshot: typeof onSnapshot;
    Timestamp: typeof Timestamp;
    query: typeof query;
    getFirestore: typeof getFirestore;
    GoogleAuthProvider: typeof GoogleAuthProvider;
    signInWithPopup: typeof signInWithPopup;
    signInWithRedirect: typeof signInWithRedirect;
    signOut: typeof signOut;
    onAuthStateChanged: typeof onAuthStateChanged;
    getStorage: typeof getStorage;
    ref: typeof ref;
    uploadBytes: typeof uploadBytes;
    uploadBytesResumable: typeof uploadBytesResumable;
    getDownloadURL: typeof getDownloadURL;
    deleteObject: typeof deleteObject;
    listAll: typeof listAll;
    // analytics
    analytics: typeof analytics;
    getAnalytics: typeof getAnalytics;
    logEvent: typeof logEvent;
    setUserId: typeof setUserId;
    setUserProperties: typeof setUserProperties;
    setCurrentScreen: typeof setCurrentScreen;
    // performance
    performance: typeof performance;
    getPerformance: typeof getPerformance;
    trace: typeof trace;
    // messaging
    messaging: typeof messaging;
    getMessaging: typeof getMessaging;
    getToken: typeof getToken;
    onMessage: typeof onMessage;
    // remote-config
    remoteConfig: typeof remoteConfig;
    getRemoteConfig: typeof getRemoteConfig;
    fetchAndActivate: typeof fetchAndActivate;
    getValue: typeof getValue;
    setLogLevel: typeof setLogLevel;
    // functions
    functions: typeof functions;
    getFunctions: typeof getFunctions;
    httpsCallable: typeof httpsCallable;
    connectFunctionsEmulator: typeof connectFunctionsEmulator;
    useCollection: typeof useCollection;
    // 型別只在 TS 層級提供，不要放在 value 裡
    // 如需在 context 內使用型別，可這樣寫：
    // exampleQuerySnapshot?: QuerySnapshot<DocumentData>;
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
                getStorage,
                ref,
                uploadBytes,
                uploadBytesResumable,
                getDownloadURL,
                deleteObject,
                listAll,
                // analytics
                analytics,
                getAnalytics,
                logEvent,
                setUserId,
                setUserProperties,
                setCurrentScreen,
                // performance
                performance,
                getPerformance,
                trace,
                // messaging
                messaging,
                getMessaging,
                getToken,
                onMessage,
                // remote-config
                remoteConfig,
                getRemoteConfig,
                fetchAndActivate,
                getValue,
                setLogLevel,
                // functions
                functions,
                getFunctions,
                httpsCallable,
                connectFunctionsEmulator,
                useCollection,
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