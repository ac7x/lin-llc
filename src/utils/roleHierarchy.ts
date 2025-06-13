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

// 角色中文名稱對應
export const ROLE_NAMES: Record<RoleKey, string> = {
  user: '一般用戶',
  helper: '助手',
  temporary: '臨時用戶',
  coord: '協調員',
  safety: '安全主管',
  foreman: '工頭',
  vendor: '供應商',
  finance: '財務',
  admin: '管理員',
  owner: '擁有者',
} as const;
