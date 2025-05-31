"use client";
import React, { createContext, useContext } from "react";
import {
    app, auth, db, storage, doc, getDoc, setDoc, collection, collectionGroup, getDocs, addDoc, updateDoc, deleteDoc,
    onSnapshot, Timestamp, query, where, orderBy, limit, startAfter, startAt, endBefore, endAt, runTransaction,
    getFirestore, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged,
    createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile,
    updatePassword, reauthenticateWithCredential, sendEmailVerification, linkWithCredential, unlink,
    sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, getStorage, ref, uploadBytes,
    uploadBytesResumable, getDownloadURL, deleteObject, listAll, list, getMetadata, updateMetadata, deleteField,
    writeBatch, arrayUnion, arrayRemove, increment, serverTimestamp, FieldPath, GeoPoint, setFirestoreLogLevel,
    analytics, getAnalytics, logEvent,
} from "./firebase";
import type {
    User, UserCredential, AuthProvider, Auth, UserInfo, AdditionalUserInfo, DocumentData, DocumentSnapshot,
    QuerySnapshot, QueryDocumentSnapshot, Firestore, Timestamp as TimestampType, FieldValue, Transaction,
    WriteBatch, Query, DocumentReference, CollectionReference, FirebaseStorage, StorageReference, UploadTask,
    UploadTaskSnapshot, FullMetadata, SettableMetadata, Analytics, FieldPathType, GeoPointType,
} from "./firebase";
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
    TimestampType,
    FieldValue,
    Transaction,
    WriteBatch,
    Query,
    DocumentReference,
    CollectionReference,
    FirebaseStorage,
    StorageReference,
    UploadTask,
    UploadTaskSnapshot,
    FullMetadata,
    SettableMetadata,
    Analytics,
    FieldPathType,
    GeoPointType,
};