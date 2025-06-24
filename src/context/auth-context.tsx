'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';

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
        const { initializeClientServices } = await import('@/lib/firebase-init');
        await initializeClientServices();
        
        // 動態導入 auth
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setUser(user);
          setLoading(false);
          setInitialized(true);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Auth 初始化失敗:', error);
        setLoading(false);
        setInitialized(true);
        return () => {};
      }
    };

    const unsubscribe = initializeAuth();
    
    return () => {
      unsubscribe.then(unsub => unsub());
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