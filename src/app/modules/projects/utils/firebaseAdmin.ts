// utils/firebaseAdmin.ts
import * as admin from 'firebase-admin';
import { UserRole, ROLE_LEVELS } from '../types/roles'; // 導入您的 UserRole 和 ROLE_LEVELS

// 初始化 Firebase Admin SDK 的函數
function initializeFirebaseAdmin(): admin.app.App {
  // 檢查是否已經初始化
  const existingApp = admin.apps[0];
  if (existingApp) {
    return existingApp;
  }

  let credential;
  
  // 根據環境變數選擇憑證類型
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // 使用服務帳戶金鑰 JSON 字符串
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      credential = admin.credential.cert(serviceAccount);
    } catch (error) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:', error);
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON format');
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    // 使用服務帳戶金鑰檔案路徑
    try {
      // 在 Next.js 環境中使用動態 import 或 require
      const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      credential = admin.credential.cert(serviceAccount);
    } catch (error) {
      console.error('Error loading service account from path:', error);
      throw new Error('Failed to load service account from path');
    }
  } else {
    // 使用 Application Default Credentials
    try {
      credential = admin.credential.applicationDefault();
    } catch (error) {
      console.error('Error using application default credentials:', error);
      throw new Error('Failed to initialize Firebase Admin SDK with default credentials');
    }
  }

  // 初始化 Firebase Admin SDK
  const app = admin.initializeApp({
    credential: credential,
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });

  console.log("Firebase Admin SDK initialized successfully.");
  return app;
}

// 初始化並獲取實例
let adminApp: admin.app.App | null = null;
let adminAuthInstance: admin.auth.Auth | null = null;
let adminAppCheckInstance: admin.appCheck.AppCheck | null = null;

try {
  adminApp = initializeFirebaseAdmin();
  adminAuthInstance = adminApp.auth();
  adminAppCheckInstance = adminApp.appCheck();
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
  // 提供 fallback 實例以避免運行時錯誤
  adminAuthInstance = null;
  adminAppCheckInstance = null;
}

// 導出實例
export const adminAuth = adminAuthInstance;
export const adminAppCheck = adminAppCheckInstance;

/**
 * 設定使用者的自訂角色。僅限擁有足夠權限的使用者呼叫此函數。
 * @param uid 目標使用者的 UID。
 * @param role 欲設定的角色。
 * @param callerRole 呼叫此函數的管理員角色，用於權限檢查。
 */
export async function setCustomUserRole(
  uid: string,
  role: UserRole,
  callerRole: UserRole // 這裡確保 callerRole 是 UserRole 類型
): Promise<void> {
  // 檢查 Firebase Admin SDK 是否正確初始化
  if (!adminAuth || !adminAuth.setCustomUserClaims) {
    throw new Error('Firebase Admin SDK not properly initialized');
  }

  // 實作權限檢查：只有 ADMIN 或 OWNER 才能設定角色
  const callerLevel = ROLE_LEVELS[callerRole];
  const adminLevel = ROLE_LEVELS[UserRole.ADMIN];
  const targetLevel = ROLE_LEVELS[role];

  // 檢查呼叫者的權限是否足夠執行設定角色的操作
  // 只有達到 ADMIN 級別或更高的角色才能執行此操作
  if (callerLevel < adminLevel) {
    throw new Error('Permission denied: Only roles with ADMIN level or higher can set user roles.');
  }

  // 管理員不能設定比自己權限高的角色 (例如 Admin 不能設定 Owner)
  // 如果呼叫者的級別低於目標角色的級別，則不允許設定
  if (callerLevel < targetLevel) {
    throw new Error(`Permission denied: Cannot set a role (${role}) higher than your own (${callerRole}).`);
  }

  try {
    // 設定自訂聲明
    await adminAuth.setCustomUserClaims(uid, { role: role });

    // 強制目標使用者刷新其 ID 令牌，使其下次請求時帶有新的聲明
    // 這是一個關鍵步驟，確保前端能及時獲取最新的權限
    await adminAuth.revokeRefreshTokens(uid);
    console.log(`Successfully set custom claim 'role:${role}' for user ${uid}.`);
  } catch (error: any) { // 使用 any 類型捕獲錯誤，以便訪問 error.message
    console.error('Error setting custom user role:', error.message);
    throw new Error('Failed to set custom user role: ' + error.message);
  }
}
