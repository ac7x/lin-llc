import { useState, useCallback, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import type { Permission, RolePermission, NavPermission } from '@/types/settings';
import { DEFAULT_PERMISSIONS, DEFAULT_NAV_PERMISSIONS, getDefaultPermissionsForRole } from '@/constants/permissions';
import { ROLE_HIERARCHY } from '@/utils/roleHierarchy';

export function usePermissions(userId: string | undefined) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [navPermissions, setNavPermissions] = useState<NavPermission[]>([]);
  const [loading, setLoading] = useState(true);

  const initializePermissions = useCallback(async () => {
    try {
      // 初始化權限設定
      const permissionsRef = doc(db, 'settings', 'permissions');
      const permissionsSnapshot = await getDoc(permissionsRef);
      
      if (!permissionsSnapshot.exists()) {
        // 如果不存在，使用預設權限
        const defaultPermissions = DEFAULT_PERMISSIONS;
        await setDoc(permissionsRef, { 
          permissions: defaultPermissions,
          lastUpdatedBy: userId || 'system',
          lastUpdatedAt: new Date().toISOString()
        });
        setPermissions(defaultPermissions);
      } else {
        // 如果存在，合併現有權限和預設權限
        const existingPermissions = permissionsSnapshot.data().permissions || [];
        const defaultPermissions = DEFAULT_PERMISSIONS;
        
        // 合併權限，確保所有預設權限都存在
        const mergedPermissions = [...existingPermissions];
        defaultPermissions.forEach(defaultPerm => {
          if (!mergedPermissions.find(p => p.id === defaultPerm.id)) {
            mergedPermissions.push(defaultPerm);
          }
        });
        
        // 更新 Firestore
        await setDoc(permissionsRef, { 
          permissions: mergedPermissions,
          lastUpdatedBy: userId || 'system',
          lastUpdatedAt: new Date().toISOString()
        }, { merge: true });
        
        setPermissions(mergedPermissions);
      }

      // 初始化角色權限
      const rolePermissionsRef = doc(db, 'settings', 'rolePermissions');
      const rolePermissionsSnapshot = await getDoc(rolePermissionsRef);
      
      if (!rolePermissionsSnapshot.exists()) {
        const initialRolePermissions = Object.keys(ROLE_HIERARCHY).map(role => ({
          role,
          permissions: getDefaultPermissionsForRole(role)
        }));
        await setDoc(rolePermissionsRef, { 
          roles: initialRolePermissions,
          lastUpdatedBy: userId || 'system',
          lastUpdatedAt: new Date().toISOString()
        });
        setRolePermissions(initialRolePermissions);
      } else {
        const loadedRolePermissions = rolePermissionsSnapshot.data().roles || [];
        setRolePermissions(loadedRolePermissions);
      }

      // 初始化導航權限
      const navPermissionsRef = doc(db, 'settings', 'navPermissions');
      const navPermissionsSnapshot = await getDoc(navPermissionsRef);
      
      if (!navPermissionsSnapshot.exists()) {
        await setDoc(navPermissionsRef, { 
          permissions: DEFAULT_NAV_PERMISSIONS,
          lastUpdatedBy: userId || 'system',
          lastUpdatedAt: new Date().toISOString()
        });
        setNavPermissions(DEFAULT_NAV_PERMISSIONS);
      } else {
        const loadedNavPermissions = navPermissionsSnapshot.data().permissions || [];
        setNavPermissions(loadedNavPermissions);
      }
    } catch (error) {
      console.error('初始化權限設定失敗:', error);
      // 如果初始化失敗，使用預設值
      setPermissions(DEFAULT_PERMISSIONS);
      const initialRolePermissions = Object.keys(ROLE_HIERARCHY).map(role => ({
        role,
        permissions: getDefaultPermissionsForRole(role)
      }));
      setRolePermissions(initialRolePermissions);
      setNavPermissions(DEFAULT_NAV_PERMISSIONS);
    }
  }, [userId]);

  const updatePermissions = useCallback(async (
    selectedRole: string,
    selectedPermissions: string[],
    selectedNavPermissions: string[]
  ) => {
    if (!selectedRole || !userId) return;
    
    try {
      const rolePermissionsRef = doc(db, 'settings', 'rolePermissions');
      const updatedRoles = rolePermissions.map(rp => 
        rp.role === selectedRole 
          ? { ...rp, permissions: selectedPermissions }
          : rp
      );
      
      await setDoc(rolePermissionsRef, { 
        roles: updatedRoles,
        lastUpdatedBy: userId,
        lastUpdatedAt: new Date().toISOString()
      }, { merge: true });
      setRolePermissions(updatedRoles);

      const navPermissionsRef = doc(db, 'settings', 'navPermissions');
      const updatedNavPermissions = navPermissions.map(np => ({
        ...np,
        defaultRoles: selectedNavPermissions.includes(np.id) 
          ? [...(np.defaultRoles || []), selectedRole]
          : (np.defaultRoles || []).filter(role => role !== selectedRole)
      }));
      
      await setDoc(navPermissionsRef, { 
        permissions: updatedNavPermissions,
        lastUpdatedBy: userId,
        lastUpdatedAt: new Date().toISOString()
      }, { merge: true });
      setNavPermissions(updatedNavPermissions);
      
      return true;
    } catch (error) {
      console.error('更新權限失敗:', error);
      return false;
    }
  }, [rolePermissions, navPermissions, userId]);

  useEffect(() => {
    async function fetchPermissions() {
      try {
        await initializePermissions();
      } catch (error) {
        console.error('載入權限設定失敗:', error);
        await initializePermissions();
      } finally {
        setLoading(false);
      }
    }
    fetchPermissions();
  }, [initializePermissions]);

  return {
    permissions,
    rolePermissions,
    navPermissions,
    loading,
    updatePermissions
  };
} 