// 角色層級定義工具
// 數字越高權限越大
export const ROLE_HIERARCHY: Record<string, number> = {
  user: 1,
  helper: 2,
  temporary: 3,
  coord: 4,
  safety: 5,
  foreman: 6,
  vendor: 7,
  finance: 8,
  admin: 9,
  owner: 10,
} as const;

export type RoleKey = keyof typeof ROLE_HIERARCHY;
