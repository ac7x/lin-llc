import { useState, useEffect, useCallback } from 'react';
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
  collection,
  getDocs,
} from '@/lib/firebase-client';
import { type RoleKey } from '@/constants/roles';
import { DEFAULT_ROLE_PERMISSIONS } from '@/constants/permissions';
import type { 
  AuthState, 
  UseAuthReturn, 
  PermissionCheckOptions,
  AuthError 
} from '@/types/auth';

const arrayToPermissionRecord = (permissions: readonly string[]): Record<string, boolean> => {
  return permissions.reduce((acc, permission) => {
    acc[permission] = true;
    return acc;
  }, {} as Record<string, boolean>);
};

const arePermissionsEqual = (p1?: Record<string, boolean>, p2?: Record<string, boolean>): boolean => {
    if (!p1 || !p2) return p1 === p2;
    const keys1 = Object.keys(p1).sort();
    const keys2 = Object.keys(p2).sort();
    if (keys1.length !== keys2.length) return false;
    for (let i = 0; i < keys1.length; i++) {
        if (keys1[i] !== keys2[i] || p1[keys1[i]] !== p2[keys2[i]]) {
            return false;
        }
    }
    return true;
};

const createInitialRolePermissions = (): Record<RoleKey, Record<string, boolean>> => {
  const permissions = {} as Record<RoleKey, Record<string, boolean>>;
  (Object.keys(DEFAULT_ROLE_PERMISSIONS) as RoleKey[]).forEach((role) => {
    permissions[role] = arrayToPermissionRecord(DEFAULT_ROLE_PERMISSIONS[role]);
  });
  return permissions;
};

export const useAuth = (): UseAuthReturn => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  const getStandardPermissions = useCallback(async (): Promise<Record<RoleKey, Record<string, boolean>>> => {
    const permissionRecords = createInitialRolePermissions();
    try {
      const managementRef = collection(db, 'management');
      const snapshot = await getDocs(managementRef);

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.role && data.pagePermissions) {
          const role = data.role as RoleKey;
          const permissions = data.pagePermissions.map((p: { id: string }) => p.id);
          permissionRecords[role] = arrayToPermissionRecord(permissions);
        }
      });
    } catch (error) {
      console.error("Failed to fetch role permissions from Firestore, using defaults.", error);
    }
    return permissionRecords;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
      if (!isMounted) return;

      if (currentUser) {
        try {
          const standardPermissions = await getStandardPermissions();
          const memberRef = doc(db, 'members', currentUser.uid);
          const memberDoc = await getDoc(memberRef);
          const memberData = memberDoc.data();

          if (memberData) {
            const userRole = memberData.currentRole as RoleKey;
            const standardPermsForRole = standardPermissions[userRole];
            const userPermsForRole = memberData.rolePermissions?.[userRole];

            if (!arePermissionsEqual(standardPermsForRole, userPermsForRole)) {
              const updatedRolePermissions = {
                ...(memberData.rolePermissions || {}),
                [userRole]: standardPermsForRole,
              };
              await setDoc(memberRef, { rolePermissions: updatedRolePermissions }, { merge: true });
              memberData.rolePermissions = updatedRolePermissions; 
            }
          }
          
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
                message: '載入用戶資料或同步權限時發生錯誤',
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
  }, [getStandardPermissions]);

  const signInWithGoogle = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, error: null }));
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await getIdToken(result.user);

      const memberRef = doc(db, 'members', result.user.uid);
      const memberDoc = await getDoc(memberRef);
      const standardPermissions = await getStandardPermissions();

      if (!memberDoc.exists()) {
        const guestPermissions = standardPermissions['guest'] || {};
        const memberData = {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          rolePermissions: { guest: guestPermissions },
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
