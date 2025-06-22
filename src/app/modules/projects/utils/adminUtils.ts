/**
 * 專案管理工具函數
 * 
 * 提供專案管理相關的工具函數：
 * - 權限檢查
 * - 角色驗證
 * - 數據格式化
 * - 統計計算
 */

import type { ProjectUser, ProjectRole, ProjectPermission, ProjectStats } from '../hooks/useProjectAdmin';

// 角色權限映射
export const ROLE_PERMISSIONS = {
  admin: [
    'project.create',
    'project.read',
    'project.update',
    'project.delete',
    'user.manage',
    'role.manage',
    'permission.manage',
    'analytics.view',
    'reports.generate',
  ],
  manager: [
    'project.create',
    'project.read',
    'project.update',
    'workpackage.manage',
    'issue.manage',
    'analytics.view',
  ],
  member: [
    'project.read',
    'workpackage.read',
    'workpackage.update',
    'issue.create',
    'issue.read',
    'issue.update',
  ],
  guest: [
    'project.read',
    'workpackage.read',
    'issue.read',
  ],
} as const;

// 權限分類
export const PERMISSION_CATEGORIES = {
  project: '專案管理',
  user: '用戶管理',
  role: '角色管理',
  workpackage: '工作包管理',
  issue: '問題管理',
  analytics: '分析報表',
  reports: '報表生成',
} as const;

/**
 * 檢查用戶是否有指定權限
 */
export function hasPermission(user: ProjectUser, permission: string): boolean {
  // 檢查用戶直接權限
  if (user.permissions.includes(permission)) {
    return true;
  }

  // 檢查角色權限
  const rolePermissions = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS];
  if (rolePermissions && rolePermissions.includes(permission as any)) {
    return true;
  }

  return false;
}

/**
 * 檢查用戶是否有任一權限
 */
export function hasAnyPermission(user: ProjectUser, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * 檢查用戶是否有所有權限
 */
export function hasAllPermissions(user: ProjectUser, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * 取得用戶所有權限
 */
export function getUserAllPermissions(user: ProjectUser): string[] {
  const rolePermissions = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || [];
  const userPermissions = user.permissions || [];
  
  // 合併並去重
  return [...new Set([...rolePermissions, ...userPermissions])];
}

/**
 * 格式化用戶顯示名稱
 */
export function formatUserDisplayName(user: ProjectUser): string {
  if (user.displayName) {
    return user.displayName;
  }
  
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return user.uid;
}

/**
 * 格式化用戶角色顯示
 */
export function formatUserRole(role: string): string {
  const roleNames: Record<string, string> = {
    admin: '管理員',
    manager: '專案經理',
    member: '成員',
    guest: '訪客',
  };
  
  return roleNames[role] || role;
}

/**
 * 格式化權限顯示
 */
export function formatPermission(permission: string): string {
  const permissionNames: Record<string, string> = {
    'project.create': '創建專案',
    'project.read': '查看專案',
    'project.update': '更新專案',
    'project.delete': '刪除專案',
    'user.manage': '管理用戶',
    'role.manage': '管理角色',
    'permission.manage': '管理權限',
    'workpackage.manage': '管理工作包',
    'workpackage.read': '查看工作包',
    'workpackage.update': '更新工作包',
    'issue.manage': '管理問題',
    'issue.create': '創建問題',
    'issue.read': '查看問題',
    'issue.update': '更新問題',
    'analytics.view': '查看分析',
    'reports.generate': '生成報表',
  };
  
  return permissionNames[permission] || permission;
}

/**
 * 按分類分組權限
 */
export function groupPermissionsByCategory(permissions: ProjectPermission[]): Record<string, ProjectPermission[]> {
  return permissions.reduce((groups, permission) => {
    const category = permission.category || 'other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(permission);
    return groups;
  }, {} as Record<string, ProjectPermission[]>);
}

/**
 * 計算用戶統計
 */
export function calculateUserStats(users: ProjectUser[]) {
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.isActive).length;
  const inactiveUsers = totalUsers - activeUsers;
  
  const roleCounts = users.reduce((counts, user) => {
    counts[user.role] = (counts[user.role] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  
  return {
    totalUsers,
    activeUsers,
    inactiveUsers,
    roleCounts,
    activeRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
  };
}

/**
 * 計算專案健康度分數
 */
export function calculateProjectHealthScore(stats: ProjectStats): number {
  const weights = {
    progress: 0.3,
    quality: 0.3,
    completion: 0.2,
    activity: 0.2,
  };
  
  const progressScore = stats.averageProgress;
  const qualityScore = stats.qualityScore;
  const completionScore = stats.totalProjects > 0 
    ? Math.round((stats.completedProjects / stats.totalProjects) * 100) 
    : 0;
  const activityScore = stats.totalProjects > 0 
    ? Math.round((stats.activeProjects / stats.totalProjects) * 100) 
    : 0;
  
  return Math.round(
    progressScore * weights.progress +
    qualityScore * weights.quality +
    completionScore * weights.completion +
    activityScore * weights.activity
  );
}

/**
 * 取得專案健康度等級
 */
export function getProjectHealthLevel(score: number): {
  level: 'excellent' | 'good' | 'fair' | 'poor';
  label: string;
  color: string;
} {
  if (score >= 80) {
    return { level: 'excellent', label: '優秀', color: 'text-green-600' };
  } else if (score >= 60) {
    return { level: 'good', label: '良好', color: 'text-blue-600' };
  } else if (score >= 40) {
    return { level: 'fair', label: '一般', color: 'text-yellow-600' };
  } else {
    return { level: 'poor', label: '需改善', color: 'text-red-600' };
  }
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('zh-TW');
}

/**
 * 格式化日期時間
 */
export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('zh-TW');
}

/**
 * 計算時間差
 */
export function getTimeDifference(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diff = now.getTime() - target.getTime();
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days} 天前`;
  } else if (hours > 0) {
    return `${hours} 小時前`;
  } else if (minutes > 0) {
    return `${minutes} 分鐘前`;
  } else {
    return '剛剛';
  }
}

/**
 * 驗證電子郵件格式
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 驗證用戶資料
 */
export function validateUserData(userData: Partial<ProjectUser>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (userData.email && !validateEmail(userData.email)) {
    errors.push('電子郵件格式不正確');
  }
  
  if (userData.displayName && userData.displayName.trim().length < 2) {
    errors.push('顯示名稱至少需要 2 個字元');
  }
  
  if (userData.role && !Object.keys(ROLE_PERMISSIONS).includes(userData.role)) {
    errors.push('無效的角色');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 生成用戶 ID
 */
export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 生成角色 ID
 */
export function generateRoleId(): string {
  return `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 生成權限 ID
 */
export function generatePermissionId(): string {
  return `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
