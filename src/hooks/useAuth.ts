import { FirebaseError } from 'firebase/app';
import { onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { useState, useEffect, useCallback } from 'react';

import { DEFAULT_ROLE_PERMISSIONS } from '@/constants/permissions';
import { type RoleKey, type CustomRole } from '@/constants/roles';
import {
  auth,
  db,
  GoogleAuthProvider,
  getIdToken,
  User,
} from '@/lib/firebase-client';
import type { AuthState, UseAuthReturn, PermissionCheckOptions, AuthError } from '@/types/auth';
import { getErrorMessage, logError, safeAsync, retry } from '@/utils/errorUtils';

const arrayToPermissionRecord = (permissions: readonly string[]): Record<string, boolean> => {
  return permissions.reduce(
    (acc, permission) => {
      acc[permission] = true;
      return acc;
    },
    {} as Record<string, boolean>
  );
};

const arePermissionsEqual = (
  p1?: Record<string, boolean>,
  p2?: Record<string, boolean>
): boolean => {
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
  (Object.keys(DEFAULT_ROLE_PERMISSIONS) as RoleKey[]).forEach(role => {
    permissions[role] = arrayToPermissionRecord(DEFAULT_ROLE_PERMISSIONS[role]);
  });
  return permissions;
};

// 獲取自訂角色權限
const getCustomRolePermissions = async (): Promise<Record<string, Record<string, boolean>>> => {
  const customPermissions: Record<string, Record<string, boolean>> = {};
  
  await safeAsync(async () => {
    const customRolesSnapshot = await retry(() => getDocs(collection(db, 'customRoles')), 3, 1000);
    customRolesSnapshot.forEach(doc => {
      const roleData = doc.data() as CustomRole;
      customPermissions[roleData.id] = arrayToPermissionRecord(roleData.permissions);
    });
  }, (error) => {
    logError(error, { operation: 'get_custom_role_permissions' });
  });
  
  return customPermissions;
};

export const useAuth = (): UseAuthReturn => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // 取得環境變數中的擁有者 UID
  const OWNER_UID = process.env.NEXT_PUBLIC_OWNER_UID;

  const getStandardPermissions = useCallback(async (): Promise<
    Record<RoleKey, Record<string, boolean>>
  > => {
    const permissionRecords = createInitialRolePermissions();
    
    await safeAsync(async () => {
      const managementRef = collection(db, 'management');
      const snapshot = await getDocs(managementRef);

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.role && data.pagePermissions) {
          const role = data.role as RoleKey;
          const permissions = data.pagePermissions.map((p: { id: string }) => p.id);
          permissionRecords[role] = arrayToPermissionRecord(permissions);
        }
      });
    }, (error) => {
      logError(error, { operation: 'get_standard_permissions' });
    });
    
    return permissionRecords;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
      if (!isMounted) return;

      if (currentUser) {
        await safeAsync(async () => {
          const standardPermissions = await getStandardPermissions();
          const customPermissions = await getCustomRolePermissions();
          const memberRef = doc(db, 'members', currentUser.uid);
          const memberDoc = await getDoc(memberRef);
          const memberData = memberDoc.data();

          // 檢查是否為環境變數指定的擁有者
          const isOwnerByEnv = OWNER_UID && currentUser.uid === OWNER_UID;
          
          if (memberData) {
            let userRole = memberData.currentRole as string;
            
            // 如果是環境變數指定的擁有者，強制設定為 owner 角色
            if (isOwnerByEnv && userRole !== 'owner') {
              userRole = 'owner';
              // 更新資料庫中的角色
              await setDoc(memberRef, { currentRole: 'owner' }, { merge: true });
              memberData.currentRole = 'owner';
            }

            let permissionsForRole: Record<string, boolean> | undefined;

            // 檢查是否為標準角色
            if (userRole in standardPermissions) {
              permissionsForRole = standardPermissions[userRole as RoleKey];
            } else if (userRole in customPermissions) {
              // 檢查是否為自訂角色
              permissionsForRole = customPermissions[userRole];
            }

            const userPermsForRole = memberData.rolePermissions?.[userRole];

            if (permissionsForRole && !arePermissionsEqual(permissionsForRole, userPermsForRole)) {
              const updatedRolePermissions = {
                ...(memberData.rolePermissions || {}),
                [userRole]: permissionsForRole,
              };
              await setDoc(memberRef, { rolePermissions: updatedRolePermissions }, { merge: true });
              memberData.rolePermissions = updatedRolePermissions;
            }
          } else if (isOwnerByEnv) {
            // 如果用戶不存在於 members 集合，但符合擁有者 UID，則建立擁有者帳號
            const ownerPermissions = standardPermissions['owner'] || {};
            const memberData = {
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              rolePermissions: { owner: ownerPermissions },
              currentRole: 'owner',
            };
            await setDoc(memberRef, memberData);
            
            if (isMounted) {
              setAuthState(prev => ({
                ...prev,
                user: {
                  ...currentUser,
                  currentRole: 'owner',
                  rolePermissions: { owner: ownerPermissions },
                },
                loading: false,
                error: null,
              }));
            }
            return;
          }

          if (isMounted) {
            setAuthState(prev => ({
              ...prev,
              user: {
                ...currentUser,
                currentRole: memberData?.currentRole || 'guest',
                rolePermissions: memberData?.rolePermissions || createInitialRolePermissions(),
              },
              loading: false,
              error: null,
            }));
          }
        }, (error) => {
          if (isMounted) {
            setAuthState(prev => ({
              ...prev,
              loading: false,
              error: {
                code: 'auth/error',
                message: getErrorMessage(error),
                details: error,
              },
            }));
          }
          logError(error, { operation: 'load_user_data', userId: currentUser.uid });
        });
      } else {
        if (isMounted) {
          setAuthState(prev => ({
            ...prev,
            user: null,
            loading: false,
            error: null,
          }));
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [getStandardPermissions, OWNER_UID]);

  const signInWithGoogle = async (): Promise<void> => {
    await safeAsync(async () => {
      setAuthState(prev => ({ ...prev, error: null }));
      const provider = new GoogleAuthProvider();
      const result = await retry(() => signInWithPopup(auth, provider), 3, 1000);
      await retry(() => getIdToken(result.user), 3, 1000);

      const memberRef = doc(db, 'members', result.user.uid);
      const memberDoc = await retry(() => getDoc(memberRef), 3, 1000);
      const standardPermissions = await getStandardPermissions();
      
      // 檢查是否為環境變數指定的擁有者
      const isOwnerByEnv = OWNER_UID && result.user.uid === OWNER_UID;
      
      if (!memberDoc.exists()) {
        // 如果是擁有者，設定為 owner 角色，否則設定為 guest
        const defaultRole = isOwnerByEnv ? 'owner' : 'guest';
        const defaultPermissions = standardPermissions[defaultRole] || {};
        const memberData = {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          rolePermissions: { [defaultRole]: defaultPermissions },
          currentRole: defaultRole,
        };
        await retry(() => setDoc(memberRef, memberData), 3, 1000);
      } else {
        // 如果用戶已存在，檢查是否需要更新為擁有者角色
        const memberData = memberDoc.data();
        let currentRole = memberData.currentRole || 'guest';
        
        if (isOwnerByEnv && currentRole !== 'owner') {
          currentRole = 'owner';
          await retry(() => setDoc(
            memberRef,
            {
              currentRole: 'owner',
              lastLoginAt: new Date().toISOString(),
            },
            { merge: true }
          ), 3, 1000);
        } else {
          await retry(() => setDoc(
            memberRef,
            {
              lastLoginAt: new Date().toISOString(),
            },
            { merge: true }
          ), 3, 1000);
        }
      }
    }, (error) => {
      let authError: AuthError;
      if (error instanceof FirebaseError) {
        authError = { code: error.code, message: error.message, details: error };
      } else if (error instanceof Error) {
        authError = {
          code: 'unknown',
          message: error.message,
          details: error,
        };
      } else {
        authError = {
          code: 'unknown',
          message: '登入過程中發生未知的錯誤',
          details: error,
        };
      }
      setAuthState(prev => ({ ...prev, error: authError }));
      logError(error, { operation: 'google_signin' });
      throw authError;
    });
  };

  const checkPermission = async (options: PermissionCheckOptions): Promise<boolean> => {
    const result = await safeAsync(async () => {
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
          return requiredPermissions.every(
            permission => user.rolePermissions?.[user.currentRole || '']?.[permission] === true
          );
        }
        return requiredPermissions.some(
          permission => user.rolePermissions?.[user.currentRole || '']?.[permission] === true
        );
      }

      return true;
    }, (error) => {
      logError(error, { operation: 'check_permission', options });
      return false;
    });
    
    return result ?? false;
  };

  const hasPermission = (permissionId: string): boolean => {
    const user = authState.user;
    if (!user?.currentRole || !user.rolePermissions) {
      return false;
    }

    const permissionsForCurrentRole = user.rolePermissions[user.currentRole];
    return !!permissionsForCurrentRole?.[permissionId];
  };

  const getCurrentRole = (): string | undefined => {
    return authState.user?.currentRole;
  };

  const getRolePermissions = (): Record<string, Record<string, boolean>> | undefined => {
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
