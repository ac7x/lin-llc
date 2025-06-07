"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db, doc, getDoc, setDoc } from './firebase-client';
import { initializeFirebaseAppCheck } from './firebase-appcheck';

// 重新匯出 Firestore 相關函數供其他模組使用
export { db, doc, getDoc, setDoc };

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  appCheckReady: boolean;
  appCheckTimeout?: boolean;
  appCheckLog?: string;
  retryAppCheck?: () => void;
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  loading: true,
  appCheckReady: false,
});

export function useFirebase(): FirebaseContextType {
  return useContext(FirebaseContext);
}

interface FirebaseProviderProps {
  children: ReactNode;
}

export function FirebaseProvider({ children }: FirebaseProviderProps): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [appCheckReady, setAppCheckReady] = useState(false);
  const [appCheckTimeout, setAppCheckTimeout] = useState(false);
  const [appCheckLog, setAppCheckLog] = useState<string>("");

  const retryAppCheck = () => {
    setAppCheckReady(false);
    setAppCheckTimeout(false);
    setAppCheckLog("");
    // 觸發重新初始化
    window.location.reload();
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // 初始化 App Check
    const initAppCheck = async () => {
      try {
        await initializeFirebaseAppCheck();
        if (mounted) {
          setAppCheckReady(true);
        }
      } catch (error) {
        if (mounted) {
          setAppCheckReady(false);
        }
      }
    };

    // 監聽認證狀態變化
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (mounted) {
        setUser(user);
        setLoading(false);
      }
    });

    // 設定超時（12 秒，給更多時間）
    timeoutId = setTimeout(() => {
      if (mounted && !appCheckReady) {
        setAppCheckTimeout(true);
        setAppCheckLog(log =>
          log +
          `\n⏰ [超時警告] App Check 初始化超過 12 秒` +
          `\n🔍 [除錯資訊] grecaptcha: ${typeof window !== "undefined" ? (window.grecaptcha ? '✅ 已載入' : '❌ 未載入') : "N/A"}` +
          `\n🔍 [除錯資訊] App Check Ready: ${appCheckReady}` +
          `\n🔍 [除錯資訊] 當前時間: ${new Date().toLocaleString()}` +
          `\n📋 [可能原因]` +
          `\n   • reCAPTCHA script 載入失敗或被阻擋` +
          `\n   • 網路連線速度過慢或不穩定` +
          `\n   • 廣告阻擋程式或防火牆干擾` +
          `\n   • Firebase 配置錯誤` +
          `\n   • reCAPTCHA site key 不正確`
        );
      }
    }, 12000);

    // 開始初始化
    initAppCheck();

    return () => {
      mounted = false;
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []); // 只在 mount 時執行一次

  const value: FirebaseContextType = {
    user,
    loading,
    appCheckReady,
    appCheckTimeout,
    appCheckLog,
    retryAppCheck,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}