'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { usePermission } from '@/app/(system)/permissions/hooks/use-permission';
import type { Role, Permission, UserProfile } from '@/app/(system)/permissions/types';

interface PermissionContextType {
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

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

interface PermissionProviderProps {
  children: ReactNode;
}

export function PermissionProvider({ children }: PermissionProviderProps) {
  // 使用權限 hook
  const permissionData = usePermission();

  return (
    <PermissionContext.Provider value={permissionData}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissionContext(): PermissionContextType {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissionContext 必須在 PermissionProvider 內使用');
  }
  return context;
} 