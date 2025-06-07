// src/modules/shared/domain/constants/role.ts

export const RoleList = {
  ADMIN: 'admin',
  FINANCE: 'finance',
  OWNER: 'owner',
  USER: 'user',
  VENDOR: 'vendor',
  FOREMAN: 'foreman',   // 監工
  SAFETY: 'safety',     // 安全人員
  MANAGER: 'manager',   // 專案經理
  COORD: 'coord',       // 協調人員 (短字版本)
  HELPER: 'helper',     // 助手
  TEMPORARY: 'temporary', // 臨時
} as const;

export type Role = (typeof RoleList)[keyof typeof RoleList];

// 中英文對照 (optional)
export const RoleLabelMap: Record<Role, string> = {
  admin: '系統管理者',
  finance: '財務人員',
  owner: '業主',
  user: '一般使用者',
  vendor: '協力廠商',
  foreman: '監工',
  safety: '安全人員',
  manager: '專案經理',
  coord: '協調人員',
  helper: '助手',
  temporary: '臨時',
};

// 角色對應 base 首頁（不含 /profile，用於拼接）
export const baseRoleHome: Record<Role, string> = {
  [RoleList.ADMIN]: "/admin",
  [RoleList.OWNER]: "/owner",
  [RoleList.FINANCE]: "/finance",
  [RoleList.SAFETY]: "/safety",
  [RoleList.VENDOR]: "/vendor",
  [RoleList.USER]: "/user",
  [RoleList.FOREMAN]: "/user",
  [RoleList.MANAGER]: "/user",
  [RoleList.COORD]: "/user",
  [RoleList.HELPER]: "/user",
  [RoleList.TEMPORARY]: "/user",
};

// 取得對應角色的首頁（加上 /profile）
export function getRoleHome(role: string | undefined | null): string {
  const base = baseRoleHome[role as Role] || "/user";
  return `${base}/profile`;
}