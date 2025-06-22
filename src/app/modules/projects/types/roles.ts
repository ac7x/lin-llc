// types/roles.ts

// 這裡不再需要從 firebase-admin/auth 導入 DecodedIdToken，
// 因為我們將直接通過聲明合併擴展 firebase-admin 的主模塊。
// import type { DecodedIdToken as FirebaseAdminDecodedIdToken } from 'firebase-admin/auth';

export enum UserRole {
  GUEST = 'guest', // 未登入或沒有Firebase Auth用戶
  TEMPORARY = 'temporary', // 臨時用戶
  HELPER = 'helper', // 助手
  USER = 'user', // 一般註冊用戶
  COORD = 'coord', // 協調者
  SAFETY = 'safety', // 安全負責人
  FOREMAN = 'foreman', // 領班
  VENDOR = 'vendor', // 供應商
  FINANCE = 'finance', // 財務
  MANAGER = 'manager', // 經理
  ADMIN = 'admin', // 管理員
  OWNER = 'owner', // 所有者/超級管理員
}

// 定義角色層級，數字越大權限越高
export const ROLE_LEVELS: Record<UserRole, number> = {
  [UserRole.GUEST]: 0,
  [UserRole.TEMPORARY]: 10,
  [UserRole.HELPER]: 20,
  [UserRole.USER]: 30,
  [UserRole.COORD]: 40,
  [UserRole.SAFETY]: 50,
  [UserRole.FOREMAN]: 60,
  [UserRole.VENDOR]: 70,
  [UserRole.FINANCE]: 80,
  [UserRole.MANAGER]: 90,
  [UserRole.ADMIN]: 100,
  [UserRole.OWNER]: 110,
};

/**
 * 檢查給定使用者的角色是否滿足所需角色等級。
 * @param userRole 使用者目前的角色 (從 decoded ID token claims 獲取)。
 * @param requiredRole 執行操作所需的最低角色。
 * @returns 如果使用者角色權限足夠，則為 true；否則為 false。
 */
export function hasRequiredRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  const actualLevel = userRole ? ROLE_LEVELS[userRole] : ROLE_LEVELS[UserRole.GUEST];
  const requiredLevel = ROLE_LEVELS[requiredRole];
  return actualLevel >= requiredLevel;
}

// 擴展 Firebase DecodedIdToken 類型，以包含我們的自訂聲明
// 修正：將 'firebase-admin/auth' 改為 'firebase-admin' 以擴展主模塊
declare module 'firebase-admin' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DecodedIdToken { // 注意：這裡的 DecodedIdToken 是從 'firebase-admin' 主模塊的類型中來的
    role?: UserRole; // 將 'role' 添加為可選屬性
    // 您也可以添加其他自訂聲明，例如：
    // organizationId?: string;
  }
}
