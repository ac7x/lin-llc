import { useState, useEffect } from 'react';
import { 
  auth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  getIdToken,
  onAuthStateChanged
} from '@/lib/firebase-client';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { type RoleKey, ROLE_HIERARCHY } from '@/constants/roles';
import { DEFAULT_ROLE_PERMISSIONS } from '@/app/management/components/RolePermissions';
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

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
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
          user.rolePermissions?.[user.currentRole as RoleKey]?.[permission]
        );
      }
      return requiredPermissions.some(permission => 
        user.rolePermissions?.[user.currentRole as RoleKey]?.[permission]
      );
    }

    return true;
  };

  const hasPermission = async (permissionId: string): Promise<boolean> => {
    const user = authState.user;
    if (!user?.currentRole) return false;

    try {
      const managementRef = collection(db, 'management');
      const snapshot = await getDocs(managementRef);
      const roleData = snapshot.docs.find(doc => {
        const data = doc.data();
        return data.role === user.currentRole;
      });

      if (roleData) {
        const data = roleData.data();
        const permissions = data.pagePermissions.map((p: { id: string }) => p.id);
        return permissions.includes(permissionId);
      } else {
        // 如果找不到角色配置，使用預設權限
        const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[user.currentRole] || [];
        return defaultPermissions.includes(permissionId);
      }
    } catch (error) {
      console.error('檢查權限失敗:', error);
      return false;
    }
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
    error: authState.error?.message || null,
    signInWithGoogle,
    checkPermission,
    hasPermission,
    getCurrentRole,
    getRolePermissions,
  };
};
