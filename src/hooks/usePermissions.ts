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
      const permissionsRef = doc(db, 'settings', 'permissions');
      await setDoc(permissionsRef, { permissions: DEFAULT_PERMISSIONS });
      setPermissions(DEFAULT_PERMISSIONS);

      const rolePermissionsRef = doc(db, 'settings', 'rolePermissions');
      const initialRolePermissions = Object.keys(ROLE_HIERARCHY).map(role => ({
        role,
        permissions: getDefaultPermissionsForRole(role)
      }));
      await setDoc(rolePermissionsRef, { roles: initialRolePermissions });
      setRolePermissions(initialRolePermissions);
    } catch (error) {
      console.error('初始化權限設定失敗:', error);
      setPermissions(DEFAULT_PERMISSIONS);
      const initialRolePermissions = Object.keys(ROLE_HIERARCHY).map(role => ({
        role,
        permissions: getDefaultPermissionsForRole(role)
      }));
      setRolePermissions(initialRolePermissions);
    }
  }, []);

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
        const permissionsDoc = doc(db, 'settings', 'permissions');
        const permissionsSnapshot = await getDoc(permissionsDoc);
        
        if (permissionsSnapshot.exists()) {
          const loadedPermissions = permissionsSnapshot.data().permissions || [];
          setPermissions(loadedPermissions);
        } else {
          await initializePermissions();
        }

        const rolePermissionsDoc = doc(db, 'settings', 'rolePermissions');
        const rolePermissionsSnapshot = await getDoc(rolePermissionsDoc);
        
        if (rolePermissionsSnapshot.exists()) {
          const loadedRolePermissions = rolePermissionsSnapshot.data().roles || [];
          setRolePermissions(loadedRolePermissions);
        } else {
          await initializePermissions();
        }

        const navPermissionsDoc = doc(db, 'settings', 'navPermissions');
        const navPermissionsSnapshot = await getDoc(navPermissionsDoc);
        
        if (navPermissionsSnapshot.exists()) {
          const loadedNavPermissions = navPermissionsSnapshot.data().permissions || [];
          setNavPermissions(loadedNavPermissions);
        } else {
          setNavPermissions(DEFAULT_NAV_PERMISSIONS);
          await setDoc(navPermissionsDoc, { permissions: DEFAULT_NAV_PERMISSIONS });
        }
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