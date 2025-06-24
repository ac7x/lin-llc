import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { permissionService } from '@/lib/permission-service';
import { Role, Permission, UserProfile } from '@/types';
import { isOwner } from '@/lib/env-config';

interface UsePermissionReturn {
  // 權限檢查
  checkPermission: (permissionId: string) => Promise<boolean>;
  hasPermission: (permissionId: string) => boolean;
  
  // 角色管理
  userRole: Role | null;
  userProfile: UserProfile | null;
  allRoles: Role[];
  allPermissions: Permission[];
  
  // 載入狀態
  loading: boolean;
  error: string | null;
  
  // 角色操作
  createCustomRole: (role: Omit<Role, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => Promise<string>;
  updateRolePermissions: (roleId: string, permissions: string[]) => Promise<void>;
  deleteCustomRole: (roleId: string) => Promise<void>;
  assignUserRole: (uid: string, roleId: string, expiresAt?: string) => Promise<void>;
  
  // 資料載入
  loadRoles: () => Promise<void>;
  loadPermissions: () => Promise<void>;
  loadUserData: () => Promise<void>;
}

export function usePermission(): UsePermissionReturn {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionCache, setPermissionCache] = useState<Map<string, boolean>>(new Map());

  // 載入用戶資料
  const loadUserData = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('開始載入用戶資料，UID:', user.uid);
      console.log('環境變數 OWNER_UID:', process.env.NEXT_PUBLIC_OWNER_UID);
      console.log('是否為擁有者:', isOwner(user.uid));
      
      // 檢查是否為擁有者
      if (isOwner(user.uid)) {
        console.log('用戶為擁有者，載入擁有者角色');
        // 擁有者直接載入擁有者角色
        const ownerRole = await permissionService.getAllRoles().then(roles => 
          roles.find(role => role.id === 'owner')
        );
        
        if (ownerRole) {
          setUserRole(ownerRole);
          console.log('擁有者角色已載入:', ownerRole);
        }
        
        // 載入或創建擁有者用戶資料
        const userProfile = await permissionService.getAllUsers().then(users => 
          users.find(u => u.uid === user.uid)
        );
        
        if (userProfile) {
          setUserProfile(userProfile);
          console.log('擁有者用戶資料已載入:', userProfile);
        } else {
          console.log('擁有者用戶資料不存在，將在下次登入時創建');
        }
      } else {
        console.log('用戶非擁有者，檢查權限');
        const permissionCheck = await permissionService.checkUserPermission(user.uid, 'system:read');
        setUserRole(permissionCheck.role);
        setUserProfile(permissionCheck.userProfile);
        console.log('權限檢查結果:', permissionCheck);
      }
    } catch (err) {
      console.error('載入用戶資料失敗:', err);
      setError(err instanceof Error ? err.message : '載入用戶資料失敗');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // 載入所有角色
  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const roles = await permissionService.getAllRoles();
      setAllRoles(roles);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入角色失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  // 載入所有權限
  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const permissions = await permissionService.getAllPermissions();
      setAllPermissions(permissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入權限失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  // 權限檢查函數
  const checkPermission = useCallback(async (permissionId: string): Promise<boolean> => {
    if (!user?.uid) return false;
    
    // 擁有者擁有所有權限
    if (isOwner(user.uid)) return true;
    
    // 檢查快取
    if (permissionCache.has(permissionId)) {
      return permissionCache.get(permissionId)!;
    }
    
    try {
      const permissionCheck = await permissionService.checkUserPermission(user.uid, permissionId);
      const hasPermission = permissionCheck.hasPermission;
      
      // 更新快取
      setPermissionCache(prev => new Map(prev).set(permissionId, hasPermission));
      
      return hasPermission;
    } catch (err) {
      console.error('權限檢查失敗:', err);
      return false;
    }
  }, [user?.uid, permissionCache]);

  // 同步權限檢查（基於已載入的用戶角色）
  const hasPermission = useCallback((permissionId: string): boolean => {
    if (!user?.uid) return false;
    
    // 擁有者擁有所有權限
    if (isOwner(user.uid)) return true;
    
    // 檢查快取
    if (permissionCache.has(permissionId)) {
      return permissionCache.get(permissionId)!;
    }
    
    // 基於已載入的用戶角色檢查
    if (userRole) {
      const hasPermission = userRole.permissions.includes(permissionId);
      setPermissionCache(prev => new Map(prev).set(permissionId, hasPermission));
      return hasPermission;
    }
    
    return false;
  }, [user?.uid, userRole, permissionCache]);

  // 創建自定義角色
  const createCustomRole = useCallback(async (
    role: Omit<Role, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
  ): Promise<string> => {
    if (!user?.uid) throw new Error('用戶未登入');
    
    try {
      const roleId = await permissionService.createCustomRole(role, user.uid);
      await loadRoles(); // 重新載入角色列表
      return roleId;
    } catch (err) {
      throw err instanceof Error ? err : new Error('創建角色失敗');
    }
  }, [user?.uid, loadRoles]);

  // 更新角色權限
  const updateRolePermissions = useCallback(async (
    roleId: string, 
    permissions: string[]
  ): Promise<void> => {
    if (!user?.uid) throw new Error('用戶未登入');
    
    try {
      await permissionService.updateRolePermissions(roleId, permissions, user.uid);
      await loadRoles(); // 重新載入角色列表
      
      // 清除權限快取
      setPermissionCache(new Map());
    } catch (err) {
      throw err instanceof Error ? err : new Error('更新角色權限失敗');
    }
  }, [user?.uid, loadRoles]);

  // 刪除自定義角色
  const deleteCustomRole = useCallback(async (roleId: string): Promise<void> => {
    try {
      await permissionService.deleteCustomRole(roleId);
      await loadRoles(); // 重新載入角色列表
    } catch (err) {
      throw err instanceof Error ? err : new Error('刪除角色失敗');
    }
  }, [loadRoles]);

  // 分配用戶角色
  const assignUserRole = useCallback(async (
    uid: string, 
    roleId: string, 
    expiresAt?: string
  ): Promise<void> => {
    if (!user?.uid) throw new Error('用戶未登入');
    try {
      await permissionService.assignUserRole(uid, roleId, user.uid, expiresAt);
    } catch (error) {
      throw error instanceof Error ? error : new Error('分配角色失敗');
    }
  }, [user?.uid]);

  // 初始化載入
  useEffect(() => {
    if (user?.uid) {
      void loadUserData();
      void loadRoles();
      void loadPermissions();
    }
  }, [user?.uid, loadUserData, loadRoles, loadPermissions]);

  return {
    checkPermission,
    hasPermission,
    userRole,
    userProfile,
    allRoles,
    allPermissions,
    loading,
    error,
    createCustomRole,
    updateRolePermissions,
    deleteCustomRole,
    assignUserRole,
    loadRoles,
    loadPermissions,
    loadUserData,
  };
} 