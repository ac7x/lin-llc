// app/actions/admin.ts
"use server"; // 宣告這是一個 Server Action

// --- 修正點：導入 firebase-admin 模組，讓 TypeScript 識別 'admin' 命名空間 ---
import * as admin from 'firebase-admin'; // 添加這一行

import { adminAuth, adminAppCheck, setCustomUserRole } from '../utils/firebaseAdmin'; // 導入 Admin SDK 實例和 setCustomUserRole 函數
import { UserRole, hasRequiredRole } from '../types/roles'; // 導入 UserRole 和 hasRequiredRole

/**
 * 內部幫助函數：驗證請求並返回解碼的 ID 令牌和使用者角色
 * (與 data.ts 中的 verifyRequest 相同，但可以獨立維護或抽離成一個共用工具)
 */
async function verifyAdminRequest(appCheckToken: string, idToken: string): Promise<{
  uid: string;
  role: UserRole;
  decodedToken: admin.auth.DecodedIdToken; // 顯式指定類型
}> {
  // 1. App Check 驗證 (App Integrity)
  if (!appCheckToken) {
    throw new Error("App Check token missing.");
  }
  try {
    await adminAppCheck.verifyToken(appCheckToken);
    // console.log("Server Action: App Check token valid.");
  } catch (error) {
    console.error("Server Action: App Check verification failed:", error);
    throw new Error("Invalid app. Access denied.");
  }

  // 2. 身份驗證 (User Authentication)
  if (!idToken) {
    throw new Error("ID token missing.");
  }
  let decodedToken: admin.auth.DecodedIdToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
    // console.log("Server Action: User ID token valid. UID:", decodedToken.uid);
  } catch (error) {
    console.error("Server Action: ID Token verification failed:", error);
    throw new Error("Invalid user. Access denied.");
  }

  // 從解碼的令牌中獲取自訂角色
  const role = (decodedToken.role as UserRole) || UserRole.GUEST;
  return { uid: decodedToken.uid, role, decodedToken };
}

/**
 * 範例 Server Action: 設置使用者角色 (需要 ADMIN 或 OWNER 權限)
 */
export async function setUserRole(
  targetUid: string,
  newRole: UserRole,
  appCheckToken: string,
  idToken: string
) {
  try {
    const { uid: callerUid, role: callerRole } = await verifyAdminRequest(appCheckToken, idToken);

    // 權限判斷: 只有 ADMIN 或 OWNER 角色才能設置使用者角色
    if (!hasRequiredRole(callerRole, UserRole.ADMIN)) {
      throw new Error("Permission denied: Only ADMIN or OWNER can set user roles.");
    }

    // 呼叫 setCustomUserRole 函數來實際設置角色
    // setCustomUserRole 內部會再次進行權限檢查，例如 Admin 不能設置 Owner
    await setCustomUserRole(targetUid, newRole, callerRole);

    return { status: 'success', message: `Successfully set ${targetUid}'s role to ${newRole}.` };
  } catch (error: any) {
    console.error("Error in setUserRole:", error.message);
    return { status: 'error', message: error.message || "Failed to set user role." };
  }
}

/**
 * 範例 Server Action: 獲取所有使用者列表 (需要 MANAGER 或以上權限)
 */
export async function getAllUsers(appCheckToken: string, idToken: string) {
  try {
    const { role: callerRole } = await verifyAdminRequest(appCheckToken, idToken);

    // 權限判斷: 只有 MANAGER 及以上角色才能獲取所有使用者列表
    if (!hasRequiredRole(callerRole, UserRole.MANAGER)) {
      throw new Error("Permission denied: Only MANAGER or higher can view all users.");
    }

    // 執行業務邏輯：使用 adminAuth 獲取所有使用者
    const listUsersResult = await adminAuth.listUsers(1000); // 每次最多獲取 1000 個使用者
    const users = listUsersResult.users.map(user => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      disabled: user.disabled,
      emailVerified: user.emailVerified,
      // 獲取自訂聲明中的角色
      role: (user.customClaims?.role as UserRole) || UserRole.USER, // 預設為 USER
    }));

    return { status: 'success', users: users, message: "Users fetched successfully." };
  } catch (error: any) {
    console.error("Error in getAllUsers:", error.message);
    return { status: 'error', message: error.message || "Failed to fetch users." };
  }
}
