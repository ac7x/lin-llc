/**
 * 角色相關常數定義
 * 簡化為只有擁有者和訪客兩種初始角色
 */

export type RoleKey = 'owner' | 'guest';

export const ROLE_NAMES: Record<RoleKey, string> = {
  owner: '擁有者',
  guest: '訪客',
} as const;

// 自訂角色類型（由擁有者建立）
export interface CustomRole {
  id: string;
  name: string;
  level: number; // 1-98 之間
  permissions: string[]; // 使用新的權限ID陣列
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}

export type Role = RoleKey | string; // 支援自訂角色ID

// 角色檢查常數
export const ROLE_CHECKS = {
  owner: 'isOwner',
  guest: 'isGuest',
} as const;
