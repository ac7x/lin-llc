import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { RoleKey } from '@/utils/roleHierarchy';

// 初始化 Firebase Admin SDK
if (!getApps().length) {
  initializeApp();
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();

// 定義自訂 claims 的型別
export interface CustomClaims {
  role?: RoleKey;
  roles?: RoleKey[];
  [key: string]: unknown;
}

// 更新用戶權限
export async function updateUserClaims(uid: string, claims: CustomClaims) {
  try {
    await adminAuth.setCustomUserClaims(uid, claims);
    return true;
  } catch (error) {
    console.error('更新用戶權限失敗:', error);
    return false;
  }
}

// 獲取用戶權限
export async function getUserClaims(uid: string): Promise<CustomClaims> {
  try {
    const user = await adminAuth.getUser(uid);
    return user.customClaims as CustomClaims || {};
  } catch (error) {
    console.error('獲取用戶權限失敗:', error);
    return {};
  }
}

// 設定用戶角色
export async function setUserRole(uid: string, role: RoleKey) {
  try {
    const currentClaims = await getUserClaims(uid);
    await adminAuth.setCustomUserClaims(uid, {
      ...currentClaims,
      role,
      roles: [...(currentClaims.roles || []), role]
    });
    return true;
  } catch (error) {
    console.error('設定用戶角色失敗:', error);
    return false;
  }
}

// 移除用戶角色
export async function removeUserRole(uid: string, role: RoleKey) {
  try {
    const currentClaims = await getUserClaims(uid);
    const updatedRoles = (currentClaims.roles || []).filter((r: RoleKey) => r !== role);
    await adminAuth.setCustomUserClaims(uid, {
      ...currentClaims,
      roles: updatedRoles,
      role: updatedRoles[0] || null
    });
    return true;
  } catch (error) {
    console.error('移除用戶角色失敗:', error);
    return false;
  }
} 