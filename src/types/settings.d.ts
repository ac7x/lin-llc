/**
 * 系統設定相關型別定義
 * 包含系統設定狀態、權限設定等資料結構
 * 用於管理系統的全局設定和配置
 */

import type { Role, Permission, RolePermission, NavPermission } from '@/types/permission';

export type { Role, Permission, RolePermission, NavPermission };

export interface SettingsState {
  archiveRetentionDays: number | null;
  loading: boolean;
  updating: boolean;
  isEditingRetentionDays: boolean;
  tempRetentionDays: number | null;
  permissions: Permission[];
  rolePermissions: RolePermission[];
  selectedRoleForPermission: Role;
  selectedPermissions: string[];
  searchTerm: string;
  expandedCategories: Set<string>;
  navPermissions: NavPermission[];
  selectedNavPermissions: string[];
  navSearchTerm: string;
} 