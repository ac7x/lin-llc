'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/(system)/auth/context/auth-context';
import { permissionService } from '@/app/(system)/permissions/lib/permission-service';
import { Role, Permission, UserProfile } from '@/app/(system)/permissions/types';
import { isOwner } from '@/app/(system)/permissions/lib/env-config';

interface UsePermissionReturn {
  // 權限檢查
  checkPermission: (permissionId: string) => Promise<boolean>;
  hasPermission: (permissionId: string) => boolean;
  
  // 角色管理
  userRole: Role | null;
  userProfile: UserProfile | null;
  allRoles: Role[];
  allPermissions: Permission[];
  allUsers: UserProfile[];
  
  // 載入狀態
  loading: boolean;
  error: string | null;
  
  // 角色操作
  createCustomRole: (role: Omit<Role, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => Promise<string>;
  updateRolePermissions: (roleId: string, permissions: string[]) => Promise<void>;
  updateRoleName: (roleId: string, name: string) => Promise<void>;
  updateRoleDescription: (roleId: string, description: string) => Promise<void>;
  deleteCustomRole: (roleId: string) => Promise<void>;
  assignUserRole: (uid: string, roleId: string, expiresAt?: string) => Promise<void>;
  
  // 資料載入
  loadRoles: () => Promise<void>;
  loadPermissions: () => Promise<void>;
  loadUserData: () => Promise<void>;
  loadAllUsers: () => Promise<void>;
  
  // 新增方法
  updateUserActivity: () => Promise<void>;
  isUserOnline: (lastActivityAt?: string, lastLoginAt?: string) => boolean;
  
  // 積分相關
  allUsersLoading: boolean;
  pointsLeaderboard: Array<{ uid: string; displayName: string; points: number; photoURL?: string }>;
  pointsHistory: Array<{ points: number; reason: string; createdAt: string }>;
  userPoints: number;
  loadPointsLeaderboard: (limitCount?: number) => Promise<void>;
  loadUserPoints: (uid: string) => Promise<void>;
  loadPointsHistory: (uid: string, limitCount?: number) => Promise<void>;
  addUserPoints: (uid: string, pointsToAdd: number, reason?: string) => Promise<void>;
}

export function usePermission(): UsePermissionReturn {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allUsersLoading, setAllUsersLoading] = useState(false);
  const [pointsLeaderboard, setPointsLeaderboard] = useState<Array<{ uid: string; displayName: string; points: number; photoURL?: string }>>([]);
  const [pointsHistory, setPointsHistory] = useState<Array<{ points: number; reason: string; createdAt: string }>>([]);
  const [userPoints, setUserPoints] = useState<number>(0);
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

  // 載入所有用戶
  const loadAllUsers = useCallback(async () => {
    if (!userProfile?.uid) return;
    
    setAllUsersLoading(true);
    try {
      const users = await permissionService.getAllUsers();
      setAllUsers(users);
    } catch (error) {
      console.error('載入所有用戶失敗:', error);
    } finally {
      setAllUsersLoading(false);
    }
  }, [userProfile?.uid]);

  // 載入積分排行榜
  const loadPointsLeaderboard = useCallback(async (limitCount: number = 10) => {
    try {
      const leaderboard = await permissionService.getPointsLeaderboard(limitCount);
      setPointsLeaderboard(leaderboard);
    } catch (error) {
      console.error('載入積分排行榜失敗:', error);
    }
  }, []);

  // 載入用戶積分
  const loadUserPoints = useCallback(async (uid: string) => {
    try {
      const points = await permissionService.getUserPoints(uid);
      setUserPoints(points);
    } catch (error) {
      console.error('載入用戶積分失敗:', error);
    }
  }, []);

  // 載入積分歷史記錄
  const loadPointsHistory = useCallback(async (uid: string, limitCount: number = 20) => {
    try {
      const history = await permissionService.getPointsHistory(uid, limitCount);
      setPointsHistory(history);
    } catch (error) {
      console.error('載入積分歷史記錄失敗:', error);
    }
  }, []);

  // 增加用戶積分
  const addUserPoints = useCallback(async (uid: string, pointsToAdd: number, reason?: string) => {
    try {
      await permissionService.addUserPoints(uid, pointsToAdd, reason);
      // 重新載入相關資料
      if (uid === userProfile?.uid) {
        await loadUserPoints(uid);
      }
      await loadPointsLeaderboard();
    } catch (error) {
      console.error('增加用戶積分失敗:', error);
      throw error;
    }
  }, [userProfile?.uid, loadUserPoints, loadPointsLeaderboard]);

  // 更新用戶活動時間
  const updateUserActivity = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      await permissionService.updateUserActivity(user.uid);
    } catch (err) {
      console.error('更新用戶活動時間失敗:', err);
    }
  }, [user?.uid]);

  // 檢查用戶是否在線
  const isUserOnline = useCallback((lastActivityAt?: string, lastLoginAt?: string): boolean => {
    return permissionService.isUserOnline(lastActivityAt, lastLoginAt);
  }, []);

  // 定期更新用戶活動時間
  useEffect(() => {
    if (!user?.uid) return;
    
    // 初始更新
    void updateUserActivity();
    
    // 每分鐘更新一次活動時間
    const interval = setInterval(() => {
      void updateUserActivity();
    }, 60000); // 60秒
    
    return () => clearInterval(interval);
  }, [user?.uid, updateUserActivity]);

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

  // 更新角色名稱
  const updateRoleName = useCallback(async (
    roleId: string, 
    name: string
  ): Promise<void> => {
    if (!user?.uid) throw new Error('用戶未登入');
    
    try {
      await permissionService.updateRoleName(roleId, name, user.uid);
    } catch (err) {
      throw err instanceof Error ? err : new Error('更新角色名稱失敗');
    }
  }, [user?.uid]);

  // 更新角色描述
  const updateRoleDescription = useCallback(async (
    roleId: string, 
    description: string
  ): Promise<void> => {
    if (!user?.uid) throw new Error('用戶未登入');
    
    try {
      await permissionService.updateRoleDescription(roleId, description, user.uid);
    } catch (err) {
      throw err instanceof Error ? err : new Error('更新角色描述失敗');
    }
  }, [user?.uid]);

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
      void loadAllUsers();
    }
  }, [user?.uid, loadUserData, loadRoles, loadPermissions, loadAllUsers]);

  return {
    checkPermission,
    hasPermission,
    userRole,
    userProfile,
    allRoles,
    allPermissions,
    allUsers,
    loading,
    error,
    createCustomRole,
    updateRolePermissions,
    updateRoleName,
    updateRoleDescription,
    deleteCustomRole,
    assignUserRole,
    loadRoles,
    loadPermissions,
    loadUserData,
    loadAllUsers,
    updateUserActivity,
    isUserOnline,
    allUsersLoading,
    pointsLeaderboard,
    pointsHistory,
    userPoints,
    loadPointsLeaderboard,
    loadUserPoints,
    loadPointsHistory,
    addUserPoints,
  };
} 