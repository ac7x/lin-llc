"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase-client';
import { initializeFirebaseAppCheck } from './firebase-appcheck';

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
        setAppCheckLog("🔄 開始初始化 App Check...");
        
        // 檢查當前環境
        if (typeof window !== 'undefined') {
          setAppCheckLog(log => log + `\n🔍 檢查 reCAPTCHA: ${typeof window.grecaptcha !== 'undefined' ? '✅ 已載入' : '❌ 未載入'}`);
          setAppCheckLog(log => log + `\n🌐 當前 URL: ${window.location.href}`);
          setAppCheckLog(log => log + `\n📍 User Agent: ${navigator.userAgent.substring(0, 100)}...`);
        }
        
        await initializeFirebaseAppCheck((logMessage: string) => {
          if (mounted) {
            setAppCheckLog(log => log + `\n${logMessage}`);
          }
        });
        
        if (mounted) {
          setAppCheckReady(true);
          setAppCheckLog(log => log + "\n✅ App Check 初始化成功！");
          // 清除超時計時器，因為已經成功
          clearTimeout(timeoutId);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        setAppCheckLog(log => log + `\n❌ App Check 初始化失敗: ${errorMsg}`);
        
        if (mounted) {
          setAppCheckReady(false);
          // 不要在這裡設定 timeout，讓超時機制來處理
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