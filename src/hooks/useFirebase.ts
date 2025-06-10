"use client";

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { subscribeToAuthState, initializeFirebaseAppCheck } from '@/lib/firebase-client';

// 重新導出所有 firebase-client.ts 功能
export * from '@/lib/firebase-client';

/**
 * Firebase 認證狀態 hook
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // 初始化 App Check
    const initAppCheck = async () => {
      try {
        await initializeFirebaseAppCheck();
        setInitialized(true);
      } catch (error) {
        console.error('App Check 初始化失敗:', error);
        setInitialized(true); // 即使失敗也要繼續
      }
    };

    initAppCheck();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const unsubscribe = subscribeToAuthState((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, [initialized]);

  return { 
    user, 
    loading: loading || !initialized,
    isAuthenticated: !!user,
    isInitialized: initialized,
    isReady: initialized && !loading // 新增 isReady 屬性
  };
}

/**
 * Firebase App Check 狀態 hook
 */
export function useAppCheck() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initAppCheck = async () => {
      try {
        await initializeFirebaseAppCheck();
        setInitialized(true);
      } catch (err) {
        setError(err as Error);
        console.error('App Check 初始化失敗:', err);
      }
    };

    initAppCheck();
  }, []);

  return { initialized, error };
}

/**
 * 組合 hook - 提供完整的 Firebase 狀態
 */
export function useFirebase() {
  const auth = useAuth();
  const appCheck = useAppCheck();

  return {
    ...auth,
    appCheck,
    isReady: auth.isInitialized && appCheck.initialized
  };
}