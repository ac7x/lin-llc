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