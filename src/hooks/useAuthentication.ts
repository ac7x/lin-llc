"use client";

import { useState, useEffect, useMemo } from "react";
import { User } from "firebase/auth";
import { useDocument } from "react-firebase-hooks/firestore";
import type { AppUser } from "@/types/user";
import { ROLE_HIERARCHY } from "@/utils/authUtils";
import {
  initializeFirebaseAppCheck,
  db,
  doc,
  setDoc,
  serverTimestamp,
} from "@/lib/firebase-client";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { FieldValue } from "firebase/firestore";

// 擴展 User 類型，讓 customClaims 有型別
interface UserWithClaims extends User {
  customClaims?: {
    role?: string;
    roles?: string[];
    permissions?: string[];
  };
}

type AppUserWrite = Omit<AppUser, 'createdAt' | 'updatedAt' | 'lastLoginAt'> & {
  createdAt: string | Date | FieldValue;
  updatedAt: string | Date | FieldValue;
  lastLoginAt: string | Date | FieldValue;
};

interface AppCheckState {
  initialized: boolean;
  error: Error | null;
  isInitializing: boolean;
}

interface UseAuthReturn {
  user: UserWithClaims | null;
  loading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isReady: boolean;
  userRole?: string;
  userRoles: string[];
  userPermissions: string[];
  error?: Error;
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
  appCheck: AppCheckState;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<User>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<UserWithClaims | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [appCheckError, setAppCheckError] = useState<Error | null>(null);
  const auth = getAuth();

  // 取得使用者 Firestore 文件
  const [userDoc, roleLoading, roleError] = useDocument(
    user ? doc(db, "users", user.uid) : null
  );

  // 角色、角色列表、權限
  const userRole = useMemo(() => {
    const claims = user?.customClaims;
    if (claims?.role) return claims.role;
    const userData = userDoc?.data() as AppUser | undefined;
    return userData?.role;
  }, [user, userDoc]);

  const userRoles = useMemo(() => {
    const claims = user?.customClaims;
    if (claims?.roles) return claims.roles;
    const userData = userDoc?.data() as AppUser | undefined;
    if (userData?.roles) return userData.roles;
    return userData?.role ? [userData.role] : [];
  }, [user, userDoc]);

  const userPermissions = useMemo(() => {
    const claims = user?.customClaims;
    if (claims?.permissions) return claims.permissions;
    const userData = userDoc?.data() as AppUser | undefined;
    return userData?.permissions || [];
  }, [user, userDoc]);

  // 角色判斷
  const hasRole = (role: string) => userRole === role;
  const hasAnyRole = (roles: string[]) =>
    userRoles.some((role) => roles.includes(role));
  const hasMinRole = (minRole: string) => {
    if (!userRole) return false;
    return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[minRole] || 0);
  };

  // 角色旗標
  const isOwner = hasRole("owner");
  const isAdmin = hasRole("admin");
  const isFinance = hasRole("finance");
  const isUserRole = hasRole("user");
  const isHelper = hasRole("helper");
  const isTemporary = hasRole("temporary");
  const isCoord = hasRole("coord");
  const isSafety = hasRole("safety");
  const isForeman = hasRole("foreman");
  const isVendor = hasRole("vendor");

  // 初始化 App Check
  useEffect(() => {
    const initAppCheck = async () => {
      try {
        await initializeFirebaseAppCheck();
        setInitialized(true);
      } catch (error) {
        setAppCheckError(error instanceof Error ? error : new Error(String(error)));
        setInitialized(true);
      }
    };
    initAppCheck();
  }, []);

  // 監聽使用者登入狀態
  useEffect(() => {
    if (!initialized) return;
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u as UserWithClaims);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [initialized, auth]);

  // 登入、登出、Google 登入
  const signIn = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const userData: AppUserWrite = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
      emailVerified: result.user.emailVerified,
      role: "user",
      roles: ["user"],
      permissions: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };
    await setDoc(doc(db, "users", result.user.uid), userData, { merge: true });
    return result.user;
  };

  return {
    user,
    loading: loading || !initialized || roleLoading,
    isAuthenticated: !!user,
    isInitialized: initialized,
    isReady: initialized && !loading && !roleLoading,
    userRole,
    userRoles,
    userPermissions,
    error: roleError,
    hasRole,
    hasAnyRole,
    hasMinRole,
    isOwner,
    isAdmin,
    isFinance,
    isUser: isUserRole,
    isHelper,
    isTemporary,
    isCoord,
    isSafety,
    isForeman,
    isVendor,
    appCheck: {
      initialized,
      error: appCheckError,
      isInitializing: false,
    },
    signIn,
    signOut,
    signInWithGoogle,
  };
}