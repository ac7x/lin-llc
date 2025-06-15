/**
 * 權限管理 Hook
 * 提供權限相關的功能和狀態管理
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import type { Role, UnifiedPermission, PermissionState } from '@/types/permission';
import { permissionManager } from '@/utils/authUtils';

export function usePermissions(userId: string | undefined) {
  const [state, setState] = useState<PermissionState>({
    permissions: [],
    loading: true,
    error: null
  });

  const permissionManagerRef = useRef(permissionManager);

  // 載入權限
  useEffect(() => {
    async function fetchPermissions() {
      if (!userId) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        const permissionsDoc = doc(db, 'settings', 'permissions');
        const snapshot = await getDoc(permissionsDoc);
        
        if (snapshot.exists()) {
          const permissions = snapshot.data().permissions as UnifiedPermission[];
          permissionManagerRef.current.initializePermissions(permissions);
          setState({
            permissions,
            loading: false,
            error: null
          });
        } else {
          setState({
            permissions: [],
            loading: false,
            error: new Error('找不到權限設定')
          });
        }
      } catch (error) {
        setState({
          permissions: [],
          loading: false,
          error: error instanceof Error ? error : new Error('載入權限失敗')
        });
      }
    }

    fetchPermissions();
  }, [userId]);

  // 檢查權限
  const hasPermission = useCallback((permissionId: string, userRoles: Role[]) => {
    return permissionManagerRef.current.checkPermission(userRoles, permissionId).hasPermission;
  }, []);

  // 更新權限
  const updatePermissions = useCallback(async (
    selectedRoles: Role[],
    selectedPermissions: string[]
  ) => {
    if (!userId) return false;

    try {
      const permissionsDoc = doc(db, 'settings', 'permissions');
      const currentPermissions = state.permissions.map(p => {
        if (selectedPermissions.includes(p.id)) {
          return {
            ...p,
            roles: [...new Set([...p.roles, ...selectedRoles])]
          };
        }
        return p;
      });

      await setDoc(permissionsDoc, { permissions: currentPermissions }, { merge: true });
      
      permissionManagerRef.current.initializePermissions(currentPermissions);
      setState(prev => ({
        ...prev,
        permissions: currentPermissions
      }));

      return true;
    } catch (error) {
      console.error('更新權限失敗:', error);
      return false;
    }
  }, [userId, state.permissions]);

  return {
    ...state,
    hasPermission,
    updatePermissions,
    getNavigationPermissions: (roles: Role[]) => permissionManagerRef.current.getNavigationPermissions(roles),
    getSystemPermissions: (roles: Role[]) => permissionManagerRef.current.getSystemPermissions(roles),
    getFeaturePermissions: (roles: Role[]) => permissionManagerRef.current.getFeaturePermissions(roles)
  };
} 