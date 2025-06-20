/**
 * 身份驗證和用戶相關型別定義
 * 包含用戶資料、裝置資訊、權限管理等資料結構
 * 用於管理系統中的用戶資料和相關功能
 */

import { type User, type UserMetadata } from 'firebase/auth';
import { type RoleKey } from '@/constants/roles';
import type { NotificationSettings } from '@/types/notification';
import { type FieldValue } from 'firebase/firestore';

// 基本權限介面
export interface Permission {
  id: string;
  name: string;
  description: string;
  path: string;
}

// 角色權限介面
export interface RolePermission {
  role: RoleKey;
  pagePermissions: Permission[];
  updatedAt: string;
}

// 用戶裝置資訊
export type UserDevice = {
  deviceId: string; // Firebase Installation ID
  fcmToken?: string; // FCM Token
  deviceType: 'web' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  lastActive: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// 擴展 Firebase User 型別，包含自定義聲明
export interface UserWithClaims extends User {
  customClaims?: {
    role?: string;
    roles?: string[];
    permissions?: string[];
  };
}

// 擴展 Firebase User 型別
export interface AppUser extends UserWithClaims {
  role?: string;
  roles?: string[];
  permissions?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  lastLoginAt?: string | Date;
  disabled?: boolean;
  metadata: UserMetadata;
  notificationSettings?: NotificationSettings;
  fcmTokens?: string[];
  currentRole?: RoleKey;
  rolePermissions?: Record<RoleKey, Record<string, boolean>>;
}

// 用於寫入的 AppUser 型別
export type AppUserWrite = Omit<AppUser, 'createdAt' | 'updatedAt' | 'lastLoginAt'> & {
  createdAt: FieldValue;
  updatedAt: FieldValue;
  lastLoginAt: FieldValue;
};

// 權限驗證結果介面
export interface AuthResult {
  isAuthenticated: boolean;
  hasPermission: boolean;
  user: AppUser | null;
  error?: string;
}

// 權限檢查選項介面
export interface PermissionCheckOptions {
  requiredRole?: RoleKey;
  requiredPermissions?: string[];
  checkAll?: boolean;
}

// 權限驗證錯誤型別
export type AuthError = {
  code: string;
  message: string;
  details?: unknown;
};

// 權限驗證狀態型別
export type AuthState = {
  user: AppUser | null;
  loading: boolean;
  error: AuthError | null;
};

// 權限驗證 Hook 回傳值介面
export interface UseAuthReturn {
  user: AppUser | null;
  loading: boolean;
  error: AuthError | null;
  signInWithGoogle: () => Promise<void>;
  checkPermission: (options: PermissionCheckOptions) => Promise<boolean>;
  hasPermission: (permissionId: string) => boolean;
  getCurrentRole: () => RoleKey | undefined;
  getRolePermissions: () => Record<RoleKey, Record<string, boolean>> | undefined;
}

// 權限驗證上下文型別
export interface AuthContextType extends UseAuthReturn {
  signOut: () => Promise<void>;
  updateUserRole: (role: RoleKey) => Promise<void>;
  updateUserPermissions: (permissions: Record<RoleKey, boolean>) => Promise<void>;
}

// 所有角色定義
export type Role =
  | 'owner'
  | 'admin'
  | 'finance'
  | 'user'
  | 'helper'
  | 'temporary'
  | 'coord'
  | 'safety'
  | 'foreman'
  | 'vendor';

// 統一權限定義
export interface UnifiedPermission {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'system' | 'navigation' | 'feature';
  roles: Role[];
  parentId?: string;
  children?: string[];
  icon?: string;
  path?: string;
}

// 權限檢查結果型別
export interface PermissionCheckResult {
  hasPermission: boolean;
  message?: string;
}
