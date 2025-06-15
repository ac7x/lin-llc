/**
 * 權限管理工具模組
 * 提供完整的權限檢查與管理功能
 * 主要功能：
 * - 角色權限檢查（hasRole, hasAnyRole, hasMinRole）
 * - 權限驗證（checkPermission, checkAllPermissions, checkAnyPermission）
 * - 角色權限管理（getDefaultPermissionsForRole, mergeRolePermissions）
 * - 導航權限控制（filterNavPermissions, canAccessNav）
 * - 特殊權限檢查（hasSystemAdminPermission, hasFinancePermission, hasProjectPermission）
 */

import type { Role, Permission, RolePermission, NavPermission, PermissionCheckResult } from '@/types/permission';
import { ROLE_HIERARCHY } from './roleHierarchy';

/**
 * 檢查用戶是否具有指定角色
 * @param userRole 用戶角色
 * @param requiredRole 所需角色
 * @returns boolean
 */
export function hasRole(userRole: Role | undefined, requiredRole: Role): boolean {
  if (!userRole) return false;
  return userRole === requiredRole;
}

/**
 * 檢查用戶是否具有任何一個指定角色
 * @param userRoles 用戶角色列表
 * @param requiredRoles 所需角色列表
 * @returns boolean
 */
export function hasAnyRole(userRoles: Role[], requiredRoles: Role[]): boolean {
  return userRoles.some(role => requiredRoles.includes(role));
}

/**
 * 檢查用戶是否具有最低所需角色權限
 * @param userRole 用戶角色
 * @param minRole 最低所需角色
 * @returns boolean
 */
export function hasMinRole(userRole: Role | undefined, minRole: Role): boolean {
  if (!userRole) return false;
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const minLevel = ROLE_HIERARCHY[minRole] || 0;
  return userLevel >= minLevel;
}

/**
 * 檢查用戶是否具有指定權限
 * @param userPermissions 用戶權限列表
 * @param requiredPermission 所需權限
 * @returns PermissionCheckResult
 */
export function checkPermission(
  userPermissions: string[],
  requiredPermission: string
): PermissionCheckResult {
  const hasPermission = userPermissions.includes(requiredPermission);
  return {
    hasPermission,
    message: hasPermission ? undefined : '您沒有執行此操作的權限'
  };
}

/**
 * 檢查用戶是否具有所有指定權限
 * @param userPermissions 用戶權限列表
 * @param requiredPermissions 所需權限列表
 * @returns PermissionCheckResult
 */
export function checkAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[]
): PermissionCheckResult {
  const hasAllPermissions = requiredPermissions.every(permission => 
    userPermissions.includes(permission)
  );
  return {
    hasPermission: hasAllPermissions,
    message: hasAllPermissions ? undefined : '您缺少執行此操作所需的權限'
  };
}

/**
 * 檢查用戶是否具有任何一個指定權限
 * @param userPermissions 用戶權限列表
 * @param requiredPermissions 所需權限列表
 * @returns PermissionCheckResult
 */
export function checkAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): PermissionCheckResult {
  const hasAnyPermission = requiredPermissions.some(permission => 
    userPermissions.includes(permission)
  );
  return {
    hasPermission: hasAnyPermission,
    message: hasAnyPermission ? undefined : '您沒有執行此操作所需的任何權限'
  };
}

/**
 * 根據角色獲取預設權限
 * @param role 角色
 * @param permissions 所有可用權限
 * @returns string[]
 */
export function getDefaultPermissionsForRole(
  role: Role,
  permissions: Permission[]
): string[] {
  const basePermissions = ['project.view', 'workpackage.view', 'dashboard.view'];
  const notificationBasePermissions = [
    'notification.view',
    'notification.settings',
    'notification.profile'
  ];

  switch (role) {
    case 'owner':
      return permissions.map(p => p.id);
    case 'admin':
      return permissions
        .filter(p => !p.id.includes('system.'))
        .map(p => p.id);
    case 'finance':
      return [
        ...basePermissions,
        'finance.view',
        'finance.create',
        'finance.edit',
        'dashboard.analytics',
        'dashboard.export',
        ...notificationBasePermissions
      ];
    case 'foreman':
    case 'coord':
      return [
        ...basePermissions,
        'workpackage.create',
        'workpackage.edit',
        'dashboard.analytics',
        ...notificationBasePermissions
      ];
    case 'safety':
      return [
        ...basePermissions,
        'workpackage.view',
        'dashboard.analytics',
        ...notificationBasePermissions
      ];
    case 'vendor':
    case 'helper':
    case 'temporary':
    case 'user':
      return [...basePermissions, ...notificationBasePermissions];
    default:
      return [...basePermissions, ...notificationBasePermissions];
  }
}

/**
 * 合併角色權限
 * @param rolePermissions 角色權限列表
 * @returns string[]
 */
export function mergeRolePermissions(rolePermissions: RolePermission[]): string[] {
  return [...new Set(rolePermissions.flatMap(rp => rp.permissions))];
}

/**
 * 過濾導航權限
 * @param navPermissions 導航權限列表
 * @param userRoles 用戶角色列表
 * @returns NavPermission[]
 */
export function filterNavPermissions(
  navPermissions: NavPermission[],
  userRoles: Role[]
): NavPermission[] {
  return navPermissions.filter(np => 
    np.defaultRoles.some(role => userRoles.includes(role))
  );
}

/**
 * 檢查用戶是否可以訪問特定導航項目
 * @param navPermission 導航權限
 * @param userRoles 用戶角色列表
 * @returns boolean
 */
export function canAccessNav(
  navPermission: NavPermission,
  userRoles: Role[]
): boolean {
  return navPermission.defaultRoles.some(role => userRoles.includes(role));
}

/**
 * 格式化權限錯誤訊息
 * @param result PermissionCheckResult
 * @returns string
 */
export function formatPermissionError(result: PermissionCheckResult): string {
  return result.message || '權限檢查失敗';
}

/**
 * 檢查用戶是否具有系統管理權限
 * @param userPermissions 用戶權限列表
 * @returns boolean
 */
export function hasSystemAdminPermission(userPermissions: string[]): boolean {
  return userPermissions.some(permission => 
    permission.startsWith('system.') || 
    permission === 'admin' || 
    permission === 'owner'
  );
}

/**
 * 檢查用戶是否具有財務管理權限
 * @param userPermissions 用戶權限列表
 * @returns boolean
 */
export function hasFinancePermission(userPermissions: string[]): boolean {
  return userPermissions.some(permission => 
    permission.startsWith('finance.') || 
    permission === 'finance'
  );
}

/**
 * 檢查用戶是否具有專案管理權限
 * @param userPermissions 用戶權限列表
 * @returns boolean
 */
export function hasProjectPermission(userPermissions: string[]): boolean {
  return userPermissions.some(permission => 
    permission.startsWith('project.') || 
    permission === 'admin' || 
    permission === 'owner'
  );
} 