import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/app/(system)/auth/context/auth-context';
import { permissionService } from '@/app/(system)/permissions/lib/permission-service';
import { Role, Permission, UserProfile } from '@/app/(system)/permissions/types';
import { isOwner } from '@/app/(system)/permissions/lib/env-config';

/**
 * 優化後的權限管理 Hook
 * 
 * 優化內容：
 * 1. 減少日誌輸出，避免控制台污染
 * 2. 使用 useMemo 緩存計算結果
 * 3. 優化 useEffect 依賴項
 * 4. 防止重複初始化
 */

interface UsePermissionOptimizedReturn {
  checkPermission: (permissionId: string) => Promise<boolean>;
  hasPermission: (permissionId: string) => boolean;
  userRole: Role | null;
  userProfile: UserProfile | null;
  allRoles: Role[];
  allPermissions: Permission[];
  allUsers: UserProfile[];
  loading: boolean;
  error: string | null;
  
  // 角色操作（簡化版）
  createCustomRole: (role: Omit<Role, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => Promise<string>;
  updateRolePermissions: (roleId: string, permissions: string[]) => Promise<void>;
  deleteCustomRole: (roleId: string) => Promise<void>;
  assignUserRole: (uid: string, roleId: string, expiresAt?: string) => Promise<void>;
  
  // 資料載入
  loadRoles: () => Promise<void>;
  loadPermissions: () => Promise<void>;
  loadUserData: () => Promise<void>;
  loadAllUsers: () => Promise<void>;
  
  // 用戶活動
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

export function usePermissionOptimized(): UsePermissionOptimizedReturn {
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
  const [initialized, setInitialized] = useState(false);

  // 優化：使用 useMemo 緩存用戶是否為擁有者的判斷
  const isCurrentUserOwner = useMemo(() => {
    return user?.uid ? isOwner(user.uid) : false;
  }, [user?.uid]);

  // 載入用戶資料 - 減少日誌輸出
  const loadUserData = useCallback(async () => {
    if (!user?.uid || initialized) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // 只在開發環境或debug模式下輸出日誌
      if (process.env.NODE_ENV === 'development') {
        console.log('權限系統初始化中...', user.uid);
      }
      
      // 檢查是否為擁有者
      if (isCurrentUserOwner) {
        // 擁有者直接載入擁有者角色
        const ownerRole = await permissionService.getAllRoles().then(roles => 
          roles.find(role => role.id === 'owner')
        );
        
        if (ownerRole) {
          setUserRole(ownerRole);
        }
        
        // 載入或創建擁有者用戶資料
        const userProfile = await permissionService.getAllUsers().then(users => 
          users.find(u => u.uid === user.uid)
        );
        
        if (userProfile) {
          setUserProfile(userProfile);
        }
      } else {
        const permissionCheck = await permissionService.checkUserPermission(user.uid, 'system:read');
        setUserRole(permissionCheck.role);
        setUserProfile(permissionCheck.userProfile);
      }
      
      setInitialized(true);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('權限系統初始化完成');
      }
    } catch (err) {
      console.error('載入用戶資料失敗:', err);
      setError(err instanceof Error ? err.message : '載入用戶資料失敗');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, isCurrentUserOwner, initialized]);

  // 載入所有角色
  const loadRoles = useCallback(async () => {
    try {
      const roles = await permissionService.getAllRoles();
      setAllRoles(roles);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入角色失敗');
    }
  }, []);

  // 載入所有權限
  const loadPermissions = useCallback(async () => {
    try {
      const permissions = await permissionService.getAllPermissions();
      setAllPermissions(permissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入權限失敗');
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

  // 其他方法保持簡化版本...
  const loadPointsLeaderboard = useCallback(async (limitCount: number = 10) => {
    try {
      const leaderboard = await permissionService.getPointsLeaderboard(limitCount);
      setPointsLeaderboard(leaderboard);
    } catch (error) {
      console.error('載入積分排行榜失敗:', error);
    }
  }, []);

  const loadUserPoints = useCallback(async (uid: string) => {
    try {
      const points = await permissionService.getUserPoints(uid);
      setUserPoints(points);
    } catch (error) {
      console.error('載入用戶積分失敗:', error);
    }
  }, []);

  const loadPointsHistory = useCallback(async (uid: string, limitCount: number = 20) => {
    try {
      const history = await permissionService.getPointsHistory(uid, limitCount);
      setPointsHistory(history);
    } catch (error) {
      console.error('載入積分歷史記錄失敗:', error);
    }
  }, []);

  const addUserPoints = useCallback(async (uid: string, pointsToAdd: number, reason?: string) => {
    try {
      await permissionService.addUserPoints(uid, pointsToAdd, reason);
      if (uid === userProfile?.uid) {
        await loadUserPoints(uid);
      }
      await loadPointsLeaderboard();
    } catch (error) {
      console.error('增加用戶積分失敗:', error);
      throw error;
    }
  }, [userProfile?.uid, loadUserPoints, loadPointsLeaderboard]);

  const updateUserActivity = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      await permissionService.updateUserActivity(user.uid);
    } catch (err) {
      // 靜默失敗，避免日誌污染
      if (process.env.NODE_ENV === 'development') {
        console.error('更新用戶活動時間失敗:', err);
      }
    }
  }, [user?.uid]);

  const isUserOnline = useCallback((lastActivityAt?: string, lastLoginAt?: string): boolean => {
    return permissionService.isUserOnline(lastActivityAt, lastLoginAt);
  }, []);

  // 權限檢查函數 - 優化緩存
  const checkPermission = useCallback(async (permissionId: string): Promise<boolean> => {
    if (!user?.uid) return false;
    
    // 擁有者擁有所有權限
    if (isCurrentUserOwner) return true;
    
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
  }, [user?.uid, isCurrentUserOwner, permissionCache]);

  // 同步權限檢查（基於已載入的用戶角色）
  const hasPermission = useCallback((permissionId: string): boolean => {
    if (!user?.uid) return false;
    
    // 擁有者擁有所有權限
    if (isCurrentUserOwner) return true;
    
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
  }, [user?.uid, userRole, isCurrentUserOwner, permissionCache]);

  // 簡化的角色操作方法
  const createCustomRole = useCallback(async (
    role: Omit<Role, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
  ): Promise<string> => {
    if (!user?.uid) throw new Error('用戶未登入');
    
    const roleId = await permissionService.createCustomRole(role, user.uid);
    await loadRoles();
    return roleId;
  }, [user?.uid, loadRoles]);

  const updateRolePermissions = useCallback(async (
    roleId: string, 
    permissions: string[]
  ): Promise<void> => {
    if (!user?.uid) throw new Error('用戶未登入');
    
    await permissionService.updateRolePermissions(roleId, permissions, user.uid);
    await loadRoles();
    setPermissionCache(new Map()); // 清除權限快取
  }, [user?.uid, loadRoles]);

  const deleteCustomRole = useCallback(async (roleId: string): Promise<void> => {
    await permissionService.deleteCustomRole(roleId);
    await loadRoles();
  }, [loadRoles]);

  const assignUserRole = useCallback(async (
    uid: string, 
    roleId: string, 
    expiresAt?: string
  ): Promise<void> => {
    if (!user?.uid) throw new Error('用戶未登入');
    await permissionService.assignUserRole(uid, roleId, user.uid, expiresAt);
  }, [user?.uid]);

  // 優化：使用更精確的依賴項，避免不必要的重新初始化
  useEffect(() => {
    if (user?.uid && !initialized) {
      void loadUserData();
    }
  }, [user?.uid, loadUserData, initialized]);

  // 只在用戶數據載入完成後才載入其他數據
  useEffect(() => {
    if (userProfile?.uid && initialized) {
      void loadRoles();
      void loadPermissions();
      void loadAllUsers();
    }
  }, [userProfile?.uid, initialized, loadRoles, loadPermissions, loadAllUsers]);

  // 定期更新用戶活動時間（降低頻率）
  useEffect(() => {
    if (!user?.uid) return;
    
    void updateUserActivity();
    
    // 每2分鐘更新一次活動時間（原來是1分鐘）
    const interval = setInterval(() => {
      void updateUserActivity();
    }, 120000); // 120秒
    
    return () => clearInterval(interval);
  }, [user?.uid, updateUserActivity]);

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