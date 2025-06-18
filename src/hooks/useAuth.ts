/**
 * 身份驗證 Hook
 * 提供用戶認證和授權相關功能
 * 管理用戶登入狀態和角色權限
 * 整合 Firebase Auth 和 App Check 功能
 */

"use client";

import { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { useDocument } from 'react-firebase-hooks/firestore';
import type { AppUser, UserWithClaims } from '@/types/auth';
import { ROLE_HIERARCHY } from '@/utils/authUtils';
import {
  auth,
  db,
  // Firestore 功能
  doc,
  setDoc,
  serverTimestamp,
  // Auth 功能
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  // App Check 功能
  getAppCheckToken,
} from '@/lib/firebase-client';

// 導出 react-firebase-hooks
export { 
  useCollection,
  useDocument 
} from 'react-firebase-hooks/firestore';

const ROLE_CHECKS = {
  owner: 'isOwner',
  admin: 'isAdmin',
  finance: 'isFinance',
  user: 'isUser',
  helper: 'isHelper',
  temporary: 'isTemporary',
  coord: 'isCoord',
  safety: 'isSafety',
  foreman: 'isForeman',
  vendor: 'isVendor'
} as const;

// 定義 FirebaseAuth 回傳型別
interface FirebaseAuthReturn {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isReady: boolean;
  db: typeof db;
  auth: typeof auth;
}

interface UseUserRoleReturn {
  userRole: string | undefined;
  userRoles: string[];
  userPermissions: string[];
  loading: boolean;
  error: Error | undefined;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasMinRole: (minRole: string) => boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isFinance: boolean;
  isUser: boolean;
  isHelper: boolean;
  isTemporary: boolean;
  isCoord: boolean;
  isSafety: boolean;
  isForeman: boolean;
  isVendor: boolean;
}

interface AuthReturn extends FirebaseAuthReturn, UseUserRoleReturn {
  appCheck: {
    initialized: boolean;
    error: Error | null;
    isInitializing: boolean;
  };
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<User>;
}

export function useAuth(): AuthReturn {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [appCheckError, setAppCheckError] = useState<Error | null>(null);

  // 獲取用戶角色相關數據
  const [userDoc, roleLoading, roleError] = useDocument(
    user ? doc(db, 'users', user.uid) : null
  );

  const userRole = useMemo(() => {
    // 優先從 custom claims 獲取角色
    const claims = user?.customClaims;
    if (claims?.role) {
      return claims.role;
    }
    // 如果沒有 custom claims，則從 Firestore 獲取
    const userData = userDoc?.data() as AppUser | undefined;
    return userData?.role;
  }, [user, userDoc]);

  const userRoles = useMemo(() => {
    // 優先從 custom claims 獲取角色列表
    const claims = user?.customClaims;
    if (claims?.roles) {
      return claims.roles;
    }
    // 如果沒有 custom claims，則從 Firestore 獲取
    const userData = userDoc?.data() as AppUser | undefined;
    return (userData?.roles || [userData?.role])
      .filter((role): role is string => role !== undefined);
  }, [user, userDoc]);

  const userPermissions = useMemo(() => {
    // 從 custom claims 獲取權限
    const claims = user?.customClaims;
    if (claims?.permissions) {
      return claims.permissions;
    }
    // 如果沒有 custom claims，則從 Firestore 獲取
    const userData = userDoc?.data() as AppUser | undefined;
    return userData?.permissions || [];
  }, [user, userDoc]);

  const hasRole = useMemo(() => (role: string): boolean => {
    return userRole === role;
  }, [userRole]);

  const hasAnyRole = useMemo(() => (roles: string[]): boolean => {
    return userRoles.some((role: string) => role !== undefined && roles.includes(role));
  }, [userRoles]);

  const hasMinRole = useMemo(() => (minRole: string): boolean => {
    if (!userRole) return false;
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const minLevel = ROLE_HIERARCHY[minRole] || 0;
    return userLevel >= minLevel;
  }, [userRole]);

  const roleChecks = useMemo(() => {
    const checks = {
      isOwner: false,
      isAdmin: false,
      isFinance: false,
      isUser: false,
      isHelper: false,
      isTemporary: false,
      isCoord: false,
      isSafety: false,
      isForeman: false,
      isVendor: false
    };
    
    Object.entries(ROLE_CHECKS).forEach(([role, propertyName]) => {
      checks[propertyName as keyof typeof checks] = hasRole(role);
    });
    
    return checks;
  }, [hasRole]);

  useEffect(() => {
    // 簡化的 App Check 初始化
    const initAppCheck = async () => {
      try {
        // 嘗試獲取 App Check token 來初始化
        await getAppCheckToken();
        setInitialized(true);
      } catch (error) {
        console.error('App Check 初始化失敗:', error);
        setAppCheckError(error as Error);
        setInitialized(true); // 即使失敗也要繼續
      }
    };

    initAppCheck();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // 將 User 轉換為 AppUser
        const appUser = user as UserWithClaims;
        setUser(appUser as AppUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [initialized]);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // 儲存用戶資料到 Firestore
      const userData = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        emailVerified: result.user.emailVerified,
        role: 'user', // 預設角色
        roles: ['user'], // 預設角色列表
        permissions: [], // 預設權限列表
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', result.user.uid), userData, { merge: true });
      
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  return {
    user,
    loading: loading || !initialized || roleLoading,
    isAuthenticated: !!user,
    isInitialized: initialized,
    isReady: initialized && !loading && !roleLoading,
    db,
    auth,
    // User Role 功能
    userRole,
    userRoles,
    userPermissions,
    error: roleError,
    hasRole,
    hasAnyRole,
    hasMinRole,
    ...roleChecks,
    // App Check
    appCheck: {
      initialized,
      error: appCheckError,
      isInitializing: false
    },
    signIn,
    signOut: signOutUser,
    signInWithGoogle
  };
} 