"use client";

import { GoogleAuthProvider, signInWithPopup, User } from "firebase/auth";
import { useEffect, useState } from "react";
import Image from "next/image";

import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  signOut,
  useAuth
} from "@/hooks/useFirebase";

export default function SignIn() {
  const { user: authUser, loading, isReady } = useAuth();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 當 auth 狀態變更時更新本地狀態
    setUser(authUser);
  }, [authUser]);

  // 處理用戶資料儲存到 Firestore
  const saveUserToFirestore = async (user: User): Promise<void> => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userRef);

      // 建立基本用戶資料
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLogin: new Date().toISOString(),
      };

      // 如果用戶不存在，新建用戶並設定初始角色
      if (!userSnapshot.exists()) {
        await setDoc(userRef, {
          ...userData,
          role: "user", // 預設角色
          createdAt: new Date().toISOString(),
        });
      } else {
        // 用戶存在則只更新登入時間
        await setDoc(userRef, userData, { merge: true });
      }
    } catch (error) {
      console.error("儲存用戶資料失敗:", error);
    }
  };

  // Google 登入處理
  async function handleGoogleSignIn() {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);

      // 儲存用戶資料到 Firestore
      await saveUserToFirestore(result.user);
    } catch (error) {
      console.error("登入失敗:", error);
    }
  }

  // 登出處理
  async function handleSignOut() {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("登出失敗:", error);
    }
  }

  // 載入中狀態
  if (!isReady || loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        {user && (
          <div className="flex flex-col items-center mb-8">
            {user.photoURL && (
              <Image
                src={user.photoURL}
                alt="用戶照片"
                width={96}
                height={96}
                className="rounded-full mb-4 border-2 border-gray-200 dark:border-gray-700"
              />
            )}
            <h2 className="text-xl font-bold dark:text-white">{user.displayName}</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">{user.email}</p>
          </div>
        )}

        <h1 className="text-2xl font-bold text-center mb-6 dark:text-white">
          {user ? "歡迎回來" : "登入您的帳號"}
        </h1>

        {!user ? (
          <>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
              使用社交媒體帳號登入，例如 Google 帳號，<br />
              您可以輕鬆使用我們的服務，無需額外註冊。
            </p>
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm transition duration-150"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
              </svg>
              使用 Google 登入
            </button>
          </>
        ) : (
          <button
            onClick={handleSignOut}
            className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white font-semibold py-3 px-4 rounded-md shadow-sm transition duration-150"
          >
            登出
          </button>
        )}
      </div>
    </div>
  );
}