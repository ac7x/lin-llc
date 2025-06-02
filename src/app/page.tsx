'use client'
import { Button } from '@/modules/shared/interfaces/ui/button'
import { auth, googleAuthProvider, db } from '@/lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;

      // 創建或更新 Firestore 中的使用者文檔
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: 'user', // 預設角色
        updatedAt: new Date()
      }, { merge: true });

      console.log("Sign-in success", user);
    } catch (error) {
      console.error("Sign-in error", error);
    }
  };

  const signOutWithGoogle = async () => {
    try {
      await signOut(auth);
      console.log("Sign-out success");
    } catch (error) {
      console.error("Sign-out error", error);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Next.js 15 Parallel Routes Demo
          </h1>
          <p className=""></p>
        </div>
        {user ? (
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Logged in as {user.email}
            </p>
            <Button size="lg" className="px-8" onClick={signOutWithGoogle}>
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <Button size="lg" className="px-8" onClick={signInWithGoogle}>
              Sign In with Google
            </Button>
          </div>
        )}


        <div className="text-center">

        </div>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p></p>
        </div>
      </div>
    </div>
  )
}