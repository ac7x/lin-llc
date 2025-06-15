/**
 * 權限管理工具模組
 * 提供統一的權限管理功能
 */

import type { Role, UnifiedPermission, PermissionCheckResult } from '@/types/permission';
import { ROLE_HIERARCHY } from './roleHierarchy';

export class PermissionManager {
  private static instance: PermissionManager;
  private permissions: Map<string, UnifiedPermission>;
  
  private constructor() {
    this.permissions = new Map();
  }
  
  static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }
  
  // 初始化權限
  initializePermissions(permissions: UnifiedPermission[]): void {
    permissions.forEach(permission => {
      this.permissions.set(permission.id, permission);
    });
  }
  
  // 檢查權限
  checkPermission(userRoles: Role[], permissionId: string): PermissionCheckResult {
    const permission = this.permissions.get(permissionId);
    if (!permission) {
      return {
        hasPermission: false,
        message: '找不到指定的權限'
      };
    }
    
    const hasPermission = userRoles.some(role => permission.roles.includes(role));
    return {
      hasPermission,
      message: hasPermission ? undefined : '您沒有執行此操作的權限'
    };
  }
  
  // 獲取角色的所有權限
  getPermissionsForRoles(roles: Role[]): UnifiedPermission[] {
    return Array.from(this.permissions.values())
      .filter(p => roles.some(role => p.roles.includes(role)));
  }
  
  // 獲取導航權限
  getNavigationPermissions(roles: Role[]): UnifiedPermission[] {
    return this.getPermissionsForRoles(roles)
      .filter(p => p.type === 'navigation');
  }
  
  // 獲取系統權限
  getSystemPermissions(roles: Role[]): UnifiedPermission[] {
    return this.getPermissionsForRoles(roles)
      .filter(p => p.type === 'system');
  }
  
  // 獲取功能權限
  getFeaturePermissions(roles: Role[]): UnifiedPermission[] {
    return this.getPermissionsForRoles(roles)
      .filter(p => p.type === 'feature');
  }
  
  // 檢查最低角色權限
  hasMinRole(userRole: Role | undefined, minRole: Role): boolean {
    if (!userRole) return false;
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const minLevel = ROLE_HIERARCHY[minRole] || 0;
    return userLevel >= minLevel;
  }
  
  // 檢查是否具有任何指定角色
  hasAnyRole(userRoles: Role[], requiredRoles: Role[]): boolean {
    return userRoles.some(role => requiredRoles.includes(role));
  }
  
  // 格式化權限錯誤訊息
  formatPermissionError(result: PermissionCheckResult): string {
    return result.message || '權限檢查失敗';
  }
} 