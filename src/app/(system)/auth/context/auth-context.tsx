'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { permissionService } from '@/app/(system)/permissions/lib/permission-service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // 確保只在客戶端執行
    if (typeof window === 'undefined') return;

    const initializeAuth = async () => {
      try {
        // 動態導入 Firebase 初始化
        const { initializeClientServices } = await import('@/app/(system)/data/lib/firebase-init');
        await initializeClientServices();
        
        // 動態導入 auth
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        
        // 處理重定向結果
        const handleRedirectResult = async () => {
          try {
            const result = await getRedirectResult(auth);
            if (result) {
              console.log('重定向登入成功:', result.user.email);
              
              // 重定向登入成功後，自動創建或更新用戶資料
              try {
                await permissionService.createOrUpdateUserProfile(
                  result.user.uid,
                  result.user.email || '',
                  result.user.displayName || '未知用戶',
                  result.user.photoURL || undefined
                );
                console.log('重定向登入用戶資料已更新到數據庫');
              } catch (err) {
                console.error('重定向登入更新用戶資料失敗:', err);
              }
            }
          } catch (err) {
            console.error('重定向登入錯誤:', err);
          }
        };

        // 先處理重定向結果
        await handleRedirectResult();
        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          setUser(user);
          setLoading(false);
          setInitialized(true);
          
          // 當用戶登入時，自動創建或更新用戶資料
          if (user) {
            try {
              await permissionService.createOrUpdateUserProfile(
                user.uid,
                user.email || '',
                user.displayName || '未知用戶',
                user.photoURL || undefined
              );
              console.log('用戶資料已更新到數據庫');
            } catch (err) {
              console.error('更新用戶資料失敗:', err);
            }
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Auth 初始化失敗:', error);
        setLoading(false);
        setInitialized(true);
        return () => {};
      }
    };

    let unsubscribe: (() => void) | undefined;

    void initializeAuth().then((unsub) => {
      unsubscribe = unsub;
    });
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    initialized,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 