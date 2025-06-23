// app/actions/data.ts
"use server"; // 宣告這是一個 Server Action

// --- 修正點：導入 firebase-admin 模組，讓 TypeScript 識別 'admin' 命名空間 ---
import * as admin from 'firebase-admin'; // 添加這一行

import { adminAuth, adminAppCheck } from '../utils/firebaseAdmin'; // 導入 Admin SDK 實例
import { UserRole, hasRequiredRole } from '../types/roles'; // 導入 UserRole 和 hasRequiredRole
// 確保導入了正確的 Firestore 類型和方法
import { initializeServerApp } from 'firebase/app';
// 注意：這裡只導入了 Firebase Client SDK 中的 Firestore 相關函數
// 這些函數是在 initializeServerApp 建立的 app 實例上使用的
import { getFirestore, collection, doc, getDoc, addDoc } from 'firebase/firestore';


// 你的客戶端 Firebase 配置 (用於 initializeServerApp)
// 這些應該是 NEXT_PUBLIC_ 開頭的變數，但在此處直接使用以避免再次從 process.env 讀取
// 這是 Next.js Server Actions 特性，可以訪問 NEXT_PUBLIC_ 開頭的環境變數
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * 內部幫助函數：驗證請求並返回解碼的 ID 令牌和使用者角色
 */
async function verifyRequest(appCheckToken: string, idToken: string): Promise<{
  uid: string;
  role: UserRole;
  decodedToken: admin.auth.DecodedIdToken; // 顯式指定類型
}> {
  // 1. App Check 驗證 (App Integrity)
  if (!appCheckToken) {
    throw new Error("App Check token missing.");
  }
  
  // 檢查 Firebase Admin SDK 是否正確初始化
  if (!adminAppCheck) {
    throw new Error("Firebase App Check not properly initialized.");
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
  
  // 檢查 Firebase Admin SDK 是否正確初始化
  if (!adminAuth) {
    throw new Error("Firebase Admin Auth not properly initialized.");
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
 * 範例 Server Action: 獲取受保護的數據 (至少需要 USER 角色)
 */
export async function getProtectedData(appCheckToken: string, idToken: string) {
  try {
    const { uid, role } = await verifyRequest(appCheckToken, idToken);

    // 權限判斷: 只有 USER 及以上角色才能獲取數據
    if (!hasRequiredRole(role, UserRole.USER)) {
      throw new Error("Permission denied: Insufficient role to access protected data.");
    }

    // --- 執行業務邏輯 ---
    // 你可以使用 initializeServerApp 將 App Check/Auth 令牌附加到後續的 Firebase SDK 調用
    const serverApp = initializeServerApp(firebaseConfig, {
      appCheckToken: appCheckToken,
      authIdToken: idToken,
    });
    // 獲取 Firestore 實例
    const db = getFirestore(serverApp); 

    // 正確使用 Firestore collection 和 doc 函數
    const docRef = doc(collection(db, 'protected_data'), 'some_doc');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { status: 'success', data: null, message: 'Document not found.' };
    }

    const data = docSnap.data();
    return {
      status: 'success',
      data: { ...data, retrievedBy: uid, userRole: role },
      message: 'Protected data fetched successfully.',
    };
  } catch (error: any) {
    console.error("Error in getProtectedData:", error.message);
    return { status: 'error', message: error.message || "Failed to get protected data." };
  }
}

/**
 * 範例 Server Action: 提交需要 FOREMAN 角色或以上才能執行的數據
 */
export async function submitSensitiveReport(reportData: any, appCheckToken: string, idToken: string) {
  try {
    const { uid, role } = await verifyRequest(appCheckToken, idToken);

    // 權限判斷: 只有 FOREMAN 及以上角色才能提交敏感報告
    if (!hasRequiredRole(role, UserRole.FOREMAN)) {
      throw new Error("Permission denied: Insufficient role to submit sensitive report.");
    }

    // --- 執行業務邏輯 ---
    const serverApp = initializeServerApp(firebaseConfig, {
      appCheckToken: appCheckToken,
      authIdToken: idToken,
    });
    const db = getFirestore(serverApp); // 獲取 Firestore 實例

    // 正確使用 Firestore addDoc 函數
    await addDoc(collection(db, 'sensitive_reports'), {
      ...reportData,
      submittedBy: uid,
      userRole: role,
      timestamp: new Date().toISOString(),
    });

    return { status: 'success', message: 'Sensitive report submitted successfully.' };
  } catch (error: any) {
    console.error("Error in submitSensitiveReport:", error.message);
    return { status: 'error', message: error.message || "Failed to submit sensitive report." };
  }
}
