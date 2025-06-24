/**
 * 身份驗證和用戶相關型別定義
 * 包含用戶資料、權限管理等資料結構
 * 用於管理系統中的用戶資料和相關功能
 */

import type { PermissionId } from '@/constants/permissions';

// 用戶資料介面
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  currentRole: string; // 角色ID
  permissions: PermissionId[]; // 直接權限清單
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  phoneNumber?: string;
  department?: string;
  position?: string;
  employeeId?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    language: 'zh-TW' | 'en-US';
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  notificationSettings?: {
    email: boolean;
    push: boolean;
    sms: boolean;
    projectUpdates: boolean;
    systemAlerts: boolean;
    dailyReports: boolean;
    weeklySummaries: boolean;
  };
}

// 認證狀態介面
export interface AuthState {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
}

// 認證上下文介面
export interface AuthContextType extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (permissionId: PermissionId) => boolean;
  hasAnyPermission: (permissionIds: PermissionId[]) => boolean;
  hasAllPermissions: (permissionIds: PermissionId[]) => boolean;
  refreshUser: () => Promise<void>;
}
