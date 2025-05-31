"use client";
// lib/FirebaseContext.tsx
import React, { createContext, useContext } from "react";
import { app, auth, db, doc, getDoc } from "./firebase";

type FirebaseContextType = {
    app: typeof app;
    auth: typeof auth;
    db: typeof db;
    doc: typeof doc;
    getDoc: typeof getDoc;
};

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <FirebaseContext.Provider value={{ app, auth, db, doc, getDoc }}>
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