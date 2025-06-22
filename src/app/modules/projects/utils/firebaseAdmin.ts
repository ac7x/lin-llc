// utils/firebaseAdmin.ts
import * as admin from 'firebase-admin';
import { UserRole, ROLE_LEVELS } from '../types/roles'; // 導入您的 UserRole 和 ROLE_LEVELS

// 確保 Admin SDK 只初始化一次
if (!admin.apps.length) {
  let credential;
  // 根據環境變數選擇憑證類型
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    // 方式二：使用服務帳戶金鑰檔案
    // 注意：require() 在 ESM 環境下可能需要特別處理或改用動態 import
    // 在 Next.js Server Actions 中，require 通常是可用的
    // 但為避免運行時錯誤，請確保該路徑存在且檔案可讀
    credential = admin.credential.cert(require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH));
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // 方式三：使用服務帳戶金鑰 JSON 字符串
    credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
  } else {
    // 方式一：使用 Application Default Credentials (推薦用於 Google Cloud 環境)
    // 這會自動尋找 GOOGLE_APPLICATION_CREDENTIALS 環境變數指向的檔案
    credential = admin.credential.applicationDefault();
  }

  admin.initializeApp({
    credential: credential,
    projectId: process.env.FIREBASE_PROJECT_ID, // 確保設置了這個環境變數
  });

  console.log("Firebase Admin SDK initialized.");
}

// 導出 admin.auth() 和 admin.appCheck() 實例，方便在 Server Actions 中使用
// 確保它們是被初始化後的實例
export const adminAuth = admin.auth();
export const adminAppCheck = admin.appCheck();

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
  // 實作權限檢查：只有 ADMIN 或 OWNER 才能設定角色
  const callerLevel = ROLE_LEVELS[callerRole];
  const adminLevel = ROLE_LEVELS[UserRole.ADMIN];
  const ownerLevel = ROLE_LEVELS[UserRole.OWNER];
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
