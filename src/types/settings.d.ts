export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface RolePermission {
  role: string;
  permissions: string[];
}

export interface NavPermission {
  id: string;
  name: string;
  description: string;
  defaultRoles: string[];
}

export interface SettingsState {
  archiveRetentionDays: number | null;
  loading: boolean;
  updating: boolean;
  isEditingRetentionDays: boolean;
  tempRetentionDays: number | null;
  permissions: Permission[];
  rolePermissions: RolePermission[];
  selectedRoleForPermission: string;
  selectedPermissions: string[];
  searchTerm: string;
  expandedCategories: Set<string>;
  navPermissions: NavPermission[];
  selectedNavPermissions: string[];
  navSearchTerm: string;
} 