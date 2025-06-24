'use client';

import { auth } from '@/lib/firebase-init';
import { GoogleAuthProvider, signInWithRedirect, signOut as firebaseSignOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { initializeClientServices } from '@/lib/firebase-init';

// 定義 AuthContext 的型別
interface AuthContextType {
  user: User | null | undefined;
  loading: boolean;
  error?: Error;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

// 建立 AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 定義 AuthProvider 的 Props
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider 元件
 * @param {AuthProviderProps} props
 * @returns {JSX.Element}
 */
export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [user, loading, error] = useAuthState(auth);

  useEffect(() => {
    initializeClientServices().catch(console.error);
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (err) {
      console.error(err);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      signInWithGoogle,
      signOut,
    }),
    [user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 * @returns {AuthContextType}
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 