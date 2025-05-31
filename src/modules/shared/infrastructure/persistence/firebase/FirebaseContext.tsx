"use client";
// lib/FirebaseContext.tsx
import React, { createContext, useContext } from "react";
import {
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
} from "./firebase";

// react-firebase-hooks 的 useCollection
import { useCollection } from "react-firebase-hooks/firestore";

type FirebaseContextType = {
    app: typeof app;
    auth: typeof auth;
    db: typeof db;
    doc: typeof doc;
    getDoc: typeof getDoc;
    setDoc: typeof setDoc;
    collection: typeof collection;
    onSnapshot: typeof onSnapshot;
    getFirestore: typeof getFirestore;
    GoogleAuthProvider: typeof GoogleAuthProvider;
    signInWithPopup: typeof signInWithPopup;
    signInWithRedirect: typeof signInWithRedirect;
    signOut: typeof signOut;
    useCollection: typeof useCollection;
};

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <FirebaseContext.Provider
            value={{
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