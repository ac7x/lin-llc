import { useState, useEffect } from 'react';
import { FirebaseError } from 'firebase/app';
import { 
  auth, 
  db,
  GoogleAuthProvider, 
  signInWithPopup, 
  getIdToken,
  onAuthStateChanged,
  User,
  doc, 
  getDoc, 
  setDoc,
} from '@/lib/firebase-client';
import { type RoleKey, ROLE_HIERARCHY } from '@/constants/roles';
import type { 
  AuthState, 
  UseAuthReturn, 
  PermissionCheckOptions,
  AuthError 
} from '@/types/auth';

const createInitialRolePermissions = (): Record<RoleKey, Record<string, boolean>> => {
  const permissions = {} as Record<RoleKey, Record<string, boolean>>;
  (Object.keys(ROLE_HIERARCHY) as RoleKey[]).forEach((role) => {
    permissions[role] = {
      dashboard: role === 'guest',
      profile: role === 'guest'
    };
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
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
      if (!isMounted) return;

      if (currentUser) {
        try {
          const memberRef = doc(db, 'members', currentUser.uid);
          const memberDoc = await getDoc(memberRef);
          const memberData = memberDoc.data();
          
          if (isMounted) {
            setAuthState(prev => ({
              ...prev,
              user: {
                ...currentUser,
                currentRole: memberData?.currentRole || 'guest',
                rolePermissions: memberData?.rolePermissions || createInitialRolePermissions()
              },
              loading: false,
              error: null
            }));
          }
        } catch (error) {
          if (isMounted) {
            setAuthState(prev => ({
              ...prev,
              loading: false,
              error: {
                code: 'auth/error',
                message: '載入用戶資料時發生錯誤',
                details: error
              }
            }));
          }
        }
      } else {
        if (isMounted) {
          setAuthState(prev => ({
            ...prev,
            user: null,
            loading: false,
            error: null
          }));
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
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
      let authError: AuthError;
      if (err instanceof FirebaseError) {
        authError = { code: err.code, message: err.message, details: err };
      } else if (err instanceof Error) {
        authError = {
          code: 'unknown',
          message: err.message,
          details: err,
        };
      } else {
        authError = {
          code: 'unknown',
          message: '登入過程中發生未知的錯誤',
          details: err,
        };
      }
      console.error('登入失敗:', authError);
      setAuthState(prev => ({ ...prev, error: authError }));
      throw authError;
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
          user.rolePermissions?.[user.currentRole as RoleKey]?.[permission]
        );
      }
      return requiredPermissions.some(permission => 
        user.rolePermissions?.[user.currentRole as RoleKey]?.[permission]
      );
    }

    return true;
  };

  const hasPermission = (permissionId: string): boolean => {
    const user = authState.user;
    if (!user?.currentRole || !user.rolePermissions) {
      return false;
    }

    const permissionsForCurrentRole = user.rolePermissions[user.currentRole];
    return !!permissionsForCurrentRole?.[permissionId];
  };

  const getCurrentRole = (): RoleKey | undefined => {
    return authState.user?.currentRole;
  };

  const getRolePermissions = (): Record<RoleKey, Record<string, boolean>> | undefined => {
    return authState.user?.rolePermissions;
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    signInWithGoogle,
    checkPermission,
    hasPermission,
    getCurrentRole,
    getRolePermissions,
  };
};
