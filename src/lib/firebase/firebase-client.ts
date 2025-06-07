// firebase.ts
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  getRedirectResult
} from "firebase/auth";
import { firebaseConfig } from "./firebase-config";
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    startAt,
    startAfter,
    endAt,
    endBefore,
    onSnapshot,
    writeBatch,
    runTransaction,
    Timestamp,
    increment,
    arrayUnion,
    arrayRemove,
    serverTimestamp,
} from "firebase/firestore";

const app = initializeApp(firebaseConfig);

export const firebaseApp = app;
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth 相關的 exports
export {
    GoogleAuthProvider,
    signInWithRedirect,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence,
    getRedirectResult,
    collection,
    doc,
    getDoc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    startAt,
    startAfter,
    endAt,
    endBefore,
    onSnapshot,
    writeBatch,
    runTransaction,
    Timestamp,
    increment,
    arrayUnion,
    arrayRemove,
    serverTimestamp,
};

// 沒有呼叫 initializeFirebaseAppCheck
