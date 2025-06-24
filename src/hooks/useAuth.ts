'use client';

import React, { createContext, useContext, useEffect, useState, ReactElement } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase-client';
import { ROLE_PERMISSIONS, type PermissionId } from '@/constants/permissions';
import { type RoleKey } from '@/constants/roles';
import type { AppUser, AuthState } from '@/types/auth';
import { getErrorMessage, logError, safeAsync, retry } from '@/utils/errorUtils';

// 建立認證上下文
interface AuthContextType extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (permissionId: PermissionId) => boolean;
  hasAnyPermission: (permissionIds: PermissionId[]) => boolean;
  hasAllPermissions: (permissionIds: PermissionId[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 預設擁有者環境變數
const DEFAULT_OWNER_EMAIL = process.env.NEXT_PUBLIC_DEFAULT_OWNER_EMAIL;

// 將 Firebase User 轉換為 AppUser
const convertFirebaseUserToAppUser = async (firebaseUser: FirebaseUser): Promise<AppUser> => {
  const userDocRef = doc(db, 'members', firebaseUser.uid);
  const userDoc = await retry(() => getDoc(userDocRef), 3, 1000);
  
  if (userDoc.exists()) {
    const userData = userDoc.data() as Record<string, any>;
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || undefined,
      currentRole: userData.currentRole || 'guest',
      permissions: userData.permissions || ROLE_PERMISSIONS.guest,
      createdAt: userData.createdAt?.toDate() || new Date(),
      updatedAt: userData.updatedAt?.toDate() || new Date(),
      lastLoginAt: userData.lastLoginAt?.toDate(),
      isActive: userData.isActive !== false,
      phoneNumber: userData.phoneNumber,
      department: userData.department,
      position: userData.position,
      employeeId: userData.employeeId,
      emergencyContact: userData.emergencyContact,
      address: userData.address,
      preferences: userData.preferences,
    };
  }
  
  // 新用戶：檢查是否為預設擁有者
  const isDefaultOwner = DEFAULT_OWNER_EMAIL && firebaseUser.email === DEFAULT_OWNER_EMAIL;
  const defaultRole: RoleKey = isDefaultOwner ? 'owner' : 'guest';
  const defaultPermissions = ROLE_PERMISSIONS[defaultRole];
  
  const newUser: AppUser = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    photoURL: firebaseUser.photoURL || undefined,
    currentRole: defaultRole,
    permissions: defaultPermissions,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  };
  
  // 儲存新用戶到 Firestore
  await setDoc(userDocRef, {
    ...newUser,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  return newUser;
};

// 權限驗證 Hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 權限驗證 Provider 組件
export function AuthProvider({ children }: { children: ReactElement }): ReactElement {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 權限檢查函數
  const hasPermission = (permissionId: PermissionId): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permissionId);
  };

  const hasAnyPermission = (permissionIds: PermissionId[]): boolean => {
    if (!user || !user.permissions) return false;
    return permissionIds.some(id => user.permissions.includes(id));
  };

  const hasAllPermissions = (permissionIds: PermissionId[]): boolean => {
    if (!user || !user.permissions) return false;
    return permissionIds.every(id => user.permissions.includes(id));
  };

  // Google 登入
  const signInWithGoogle = async (): Promise<void> => {
    await safeAsync(async () => {
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    }, (error) => {
      const message = getErrorMessage(error);
      setError(message);
      logError('Google sign in failed', error as Record<string, unknown> | undefined);
    });
  };

  // 登出
  const signOut = async (): Promise<void> => {
    await safeAsync(async () => {
      await firebaseSignOut(auth);
      setUser(null);
    }, (error) => {
      const message = getErrorMessage(error);
      setError(message);
      logError('Sign out failed', error as Record<string, unknown> | undefined);
    });
  };

  // 重新整理用戶資料
  const refreshUser = async (): Promise<void> => {
    if (!auth.currentUser) return;
    
    await safeAsync(async () => {
      const updatedUser = await convertFirebaseUserToAppUser(auth.currentUser!);
      setUser(updatedUser);
    }, (error) => {
      const message = getErrorMessage(error);
      setError(message);
      logError('Refresh user failed', error as Record<string, unknown> | undefined);
    });
  };

  // 監聽認證狀態變化
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      await safeAsync(async () => {
        if (firebaseUser) {
          const appUser = await convertFirebaseUserToAppUser(firebaseUser);
          setUser(appUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      }, (error) => {
        const message = getErrorMessage(error);
        setError(message);
        logError('Auth state change failed', error as Record<string, unknown> | undefined);
        setLoading(false);
      });
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshUser,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
} 