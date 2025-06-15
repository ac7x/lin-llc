/**
 * 權限與角色管理工具模組
 * 提供統一的權限和角色管理功能
 */

import type { Role, UnifiedPermission, PermissionCheckResult } from '@/types/permission';

/**
 * 角色階層定義
 * 定義系統中所有角色的階層關係與顯示名稱
 */
export const ROLE_HIERARCHY: Record<string, number> = {
  temporary: 1,      // 臨時員工
  helper: 2,         // 助理
  user: 3,           // 一般員工
  coord: 4,          // 協調員
  safety: 5,         // 安全主管
  foreman: 6,        // 工頭
  vendor: 7,         // 供應商
  finance: 8,        // 財務（會計）
  manager: 9,        // 經理（專案經理／工地經理）
  admin: 10,         // 系統管理員
  owner: 11,         // 擁有者
} as const;

export type RoleKey = keyof typeof ROLE_HIERARCHY;

export const ROLE_NAMES: Record<RoleKey, string> = {
  temporary: '臨時員工',
  helper: '助理',
  user: '一般員工',
  coord: '協調員',
  safety: '安全主管',
  foreman: '工頭',
  vendor: '供應商',
  finance: '財務',
  manager: '經理',
  admin: '系統管理員',
  owner: '擁有者',
} as const;

/**
 * 權限管理類別
 * 提供權限檢查和管理功能
 */
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

// 導出單例實例
export const permissionManager = PermissionManager.getInstance(); 