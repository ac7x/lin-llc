import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// 初始化 Firebase Admin SDK
if (!getApps().length) {
  initializeApp();
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();

// 更新用戶權限
export async function updateUserClaims(uid: string, claims: Record<string, any>) {
  try {
    await adminAuth.setCustomUserClaims(uid, claims);
    return true;
  } catch (error) {
    console.error('更新用戶權限失敗:', error);
    return false;
  }
}

// 獲取用戶權限
export async function getUserClaims(uid: string) {
  try {
    const user = await adminAuth.getUser(uid);
    return user.customClaims || {};
  } catch (error) {
    console.error('獲取用戶權限失敗:', error);
    return {};
  }
} 