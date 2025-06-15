import { useState, useCallback, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import type { Permission, RolePermission, NavPermission, Role } from '@/types/permission';
import { DEFAULT_PERMISSIONS, DEFAULT_NAV_PERMISSIONS, getDefaultPermissionsForRole } from '@/constants/permissions';
import { ROLE_HIERARCHY } from '@/utils/roleHierarchy';
import { mergeRolePermissions, filterNavPermissions } from '@/utils/permission';

export function usePermissions(userId: string | undefined) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [navPermissions, setNavPermissions] = useState<NavPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

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
      
      let currentRolePermissions: RolePermission[] = [];
      
      if (!rolePermissionsSnapshot.exists()) {
        currentRolePermissions = Object.keys(ROLE_HIERARCHY).map(role => ({
          role: role as Role,
          permissions: getDefaultPermissionsForRole(role as Role)
        }));
        await setDoc(rolePermissionsRef, { 
          roles: currentRolePermissions,
          lastUpdatedBy: userId || 'system',
          lastUpdatedAt: new Date().toISOString()
        });
      } else {
        currentRolePermissions = rolePermissionsSnapshot.data().roles || [];
      }
      setRolePermissions(currentRolePermissions);

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

      // 獲取用戶角色和權限
      if (userId) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userRole = userData.role as Role;
          
          // 從角色權限中獲取用戶的權限
          const rolePerms = currentRolePermissions.find((rp: RolePermission) => rp.role === userRole);
          if (rolePerms) {
            setUserPermissions(rolePerms.permissions);
          } else {
            // 如果找不到角色權限，使用預設權限
            setUserPermissions(getDefaultPermissionsForRole(userRole));
          }
        }
      }
    } catch (error) {
      console.error('初始化權限設定失敗:', error);
      // 如果初始化失敗，使用預設值
      setPermissions(DEFAULT_PERMISSIONS);
      const initialRolePermissions = Object.keys(ROLE_HIERARCHY).map(role => ({
        role: role as Role,
        permissions: getDefaultPermissionsForRole(role as Role)
      }));
      setRolePermissions(initialRolePermissions);
      setNavPermissions(DEFAULT_NAV_PERMISSIONS);
    }
  }, [userId]);

  const updatePermissions = useCallback(async (
    selectedRoles: Role[],
    selectedPermissions: string[],
    selectedNavPermissions: string[]
  ) => {
    if (selectedRoles.length === 0 || !userId) return false;
    
    try {
      const rolePermissionsRef = doc(db, 'settings', 'rolePermissions');
      const updatedRoles = rolePermissions.map(rp => 
        selectedRoles.includes(rp.role)
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
          ? [...new Set([...(np.defaultRoles || []), ...selectedRoles])]
          : (np.defaultRoles || []).filter(role => !selectedRoles.includes(role))
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
    updatePermissions,
    userPermissions
  };
} 