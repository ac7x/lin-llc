/**
 * 權限管理相關型別定義
 * 包含角色、權限、導航權限等資料結構
 * 用於實現系統的權限控制和訪問管理
 */

import { User } from 'firebase/auth';

// 基本角色型別
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

// 權限型別
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

// 角色權限型別
export interface RolePermission {
  role: Role;
  permissions: string[];
}

// 導航權限型別
export interface NavPermission {
  id: string;
  name: string;
  description: string;
  defaultRoles: Role[];
}

// 用戶自定義資料型別
export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: Role;
  roles?: Role[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  customClaims?: {
    role?: Role;
    roles?: Role[];
  };
}

// 擴展的 Firebase User 型別
export interface ExtendedUser extends User {
  customClaims?: {
    role?: Role;
    roles?: Role[];
  };
}

// 權限檢查結果型別
export interface PermissionCheckResult {
  hasPermission: boolean;
  message?: string;
}

// 權限狀態型別
export interface PermissionState {
  permissions: Permission[];
  rolePermissions: RolePermission[];
  navPermissions: NavPermission[];
  loading: boolean;
  userPermissions: string[];
}

// 身份驗證狀態型別
export interface AuthState {
  user: ExtendedUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isReady: boolean;
  error: Error | null;
}

// 角色檢查結果型別
export interface RoleCheckResult {
  hasRole: boolean;
  hasAnyRole: boolean;
  hasMinRole: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isFinance: boolean;
  isUser: boolean;
  isHelper: boolean;
  isTemporary: boolean;
  isCoord: boolean;
  isSafety: boolean;
  isForeman: boolean;
  isVendor: boolean;
}

// 權限更新參數型別
export interface PermissionUpdateParams {
  selectedRoles: Role[];
  selectedPermissions: string[];
  selectedNavPermissions: string[];
}

// 權限類別型別
export interface PermissionCategoryProps {
  category: string;
  permissions: Permission[];
  selectedPermissions: string[];
  onPermissionChange: (permissionId: string, checked: boolean) => void;
  isExpanded: boolean;
  onToggle: () => void;
} 