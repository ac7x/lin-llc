/**
 * 角色相關常數定義
 * 簡化為只有擁有者和訪客兩種初始角色
 */

// 角色階層定義
export const ROLE_HIERARCHY = {
  owner: 0, // 擁有者 - 全部權限
  guest: 99, // 訪客 - 最低權限
} as const;

export type RoleKey = keyof typeof ROLE_HIERARCHY;

export const ROLE_NAMES: Record<RoleKey, string> = {
  owner: '擁有者',
  guest: '訪客',
} as const;

// 自訂角色類型（由擁有者建立）
export interface CustomRole {
  id: string;
  name: string;
  level: number; // 1-98 之間
  permissions: string[];
  createdAt: string;
  createdBy: string;
}

export type Role = RoleKey | string; // 支援自訂角色ID

// 角色檢查常數
export const ROLE_CHECKS = {
  owner: 'isOwner',
  guest: 'isGuest',
} as const;
