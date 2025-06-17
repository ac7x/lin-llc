import { useState, useEffect } from 'react';
import { 
  auth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  getIdToken,
  onAuthStateChanged,
  type User
} from '@/lib/firebase-client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { type RoleKey, ROLE_HIERARCHY } from '@/constants/roles';
import type { 
  AppUser, 
  AuthState, 
  UseAuthReturn, 
  PermissionCheckOptions,
  AuthError 
} from '@/types/auth';

const createInitialRolePermissions = (): Record<RoleKey, boolean> => {
  const permissions = {} as Record<RoleKey, boolean>;
  (Object.keys(ROLE_HIERARCHY) as RoleKey[]).forEach((role) => {
    permissions[role] = role === 'guest';
  });
  return permissions;
};

export const useAuth = (): UseAuthReturn => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const memberRef = doc(db, 'members', currentUser.uid);
        const memberDoc = await getDoc(memberRef);
        const memberData = memberDoc.data();
        
        setAuthState(prev => ({
          ...prev,
          user: {
            ...currentUser,
            currentRole: memberData?.currentRole || 'guest',
            rolePermissions: memberData?.rolePermissions || createInitialRolePermissions()
          },
          loading: false
        }));
      } else {
        setAuthState(prev => ({
          ...prev,
          user: null,
          loading: false
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, error: null }));
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await getIdToken(result.user);

      const memberRef = doc(db, 'members', result.user.uid);
      const memberDoc = await getDoc(memberRef);

      if (!memberDoc.exists()) {
        const memberData = {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          rolePermissions: createInitialRolePermissions(),
          currentRole: 'guest',
        };
        await setDoc(memberRef, memberData);
      } else {
        await setDoc(memberRef, {
          lastLoginAt: new Date().toISOString(),
        }, { merge: true });
      }

      console.log('登入成功，ID Token:', idToken);
    } catch (err) {
      const error = err as AuthError;
      console.error('登入失敗:', error);
      setAuthState(prev => ({
        ...prev,
        error: {
          code: error.code || 'unknown',
          message: error.message || '登入過程中發生錯誤，請稍後再試',
          details: error.details
        }
      }));
      throw error;
    }
  };

  const checkPermission = async (options: PermissionCheckOptions): Promise<boolean> => {
    const { requiredRole, requiredPermissions, checkAll = false } = options;
    const user = authState.user;

    if (!user) return false;

    // 檢查角色
    if (requiredRole && user.currentRole !== requiredRole) {
      return false;
    }

    // 檢查權限
    if (requiredPermissions && requiredPermissions.length > 0) {
      if (checkAll) {
        return requiredPermissions.every(permission => 
          user.rolePermissions?.[user.currentRole as RoleKey]
        );
      }
      return requiredPermissions.some(permission => 
        user.rolePermissions?.[user.currentRole as RoleKey]
      );
    }

    return true;
  };

  const hasPermission = (permissionId: string): boolean => {
    const user = authState.user;
    if (!user || !user.currentRole) return false;
    return user.rolePermissions?.[user.currentRole] || false;
  };

  const getCurrentRole = (): RoleKey | undefined => {
    return authState.user?.currentRole;
  };

  const getRolePermissions = (): Record<RoleKey, boolean> | undefined => {
    return authState.user?.rolePermissions;
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error?.message || null,
    signInWithGoogle,
    checkPermission,
    hasPermission,
    getCurrentRole,
    getRolePermissions,
  };
};
