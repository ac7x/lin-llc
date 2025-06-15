/**
 * 權限管理相關型別定義
 * 提供統一的權限管理系統
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

// 統一權限型別
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

// 權限狀態型別
export interface PermissionState {
  permissions: UnifiedPermission[];
  loading: boolean;
  error: Error | null;
}

// 權限檢查結果型別
export interface PermissionCheckResult {
  hasPermission: boolean;
  message?: string;
}

// 用戶自定義資料型別
export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  customClaims?: {
    roles?: Role[];
  };
}

// 擴展的 Firebase User 型別
export interface ExtendedUser extends User {
  customClaims?: {
    roles?: Role[];
  };
}

// 權限更新參數型別
export interface PermissionUpdateParams {
  selectedRoles: Role[];
  selectedPermissions: string[];
}

// 權限類別型別
export interface PermissionCategoryProps {
  category: string;
  permissions: UnifiedPermission[];
  selectedPermissions: string[];
  onPermissionChange: (permissionId: string, checked: boolean) => void;
  isExpanded: boolean;
  onToggle: () => void;
} 