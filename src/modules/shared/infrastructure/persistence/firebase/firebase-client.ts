// src/modules/shared/infrastructure/persistence/firebase/firebase-client.ts
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCUDU4n6SvAQBT8qb1R0E_oWvSeJxYu-ro",
  authDomain: "lin-llc.firebaseapp.com",
  projectId: "lin-llc",
  storageBucket: "lin-llc.firebasestorage.app",
  messagingSenderId: "394023041902",
  appId: "1:394023041902:web:f9874be5d0d192557b1f7f",
  measurementId: "G-62JEHK00G8"
};

// 初始化 Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Google 登入
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

// 登出
export const logout = () => signOut(auth);