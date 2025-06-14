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
