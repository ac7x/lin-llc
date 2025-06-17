/**
 * Firebase 客戶端初始化與核心功能
 * 提供 Firebase 服務的初始化設定
 * 包含身份驗證、資料庫操作、Storage 和 App Check 功能
 * 管理 Firebase 實例和狀態監聽
 */

// firebase.ts
import { initializeApp, FirebaseApp } from "firebase/app"; // 引入 FirebaseApp 型別
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  getRedirectResult,
  User,
  signInWithPopup,
  getIdToken,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAt,
  startAfter,
  endAt,
  endBefore,
  onSnapshot,
  writeBatch,
  runTransaction,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Firestore, // 引入 Firestore 型別
  DocumentData, // 引入 DocumentData 型別
  DocumentReference, // 引入 DocumentReference 型別
} from "firebase/firestore";
import {
  getStorage,
  connectStorageEmulator,
  ref, // 新增：引入 ref
  uploadBytesResumable, // 新增：引入 uploadBytesResumable
  getDownloadURL, // 新增：引入 getDownloadURL
  UploadMetadata, // 新增：引入 UploadMetadata
  FirebaseStorage, // 新增：引入 FirebaseStorage 型別
} from "firebase/storage";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  getToken,
  AppCheck, // 新增：引入 AppCheck 型別
} from "firebase/app-check";
import { firebaseConfig, APP_CHECK_CONFIG, FIREBASE_EMULATOR } from "./firebase-config"; // 假設這些配置存在

// --- Firebase 應用程式初始化 ---
const app: FirebaseApp = initializeApp(firebaseConfig);
export const firebaseApp: FirebaseApp = app;

// --- 服務實例初始化 ---
export const auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app); // 使用 FirebaseStorage 型別

// --- 模擬器連線 (僅在開發時使用) ---
if (FIREBASE_EMULATOR.ENABLED) {
  try {
    // 假設 Firestore 模擬器運行在 8080，Auth 在 9099
    // Cloud Functions 在 5001，Storage 在 9199
    // App Check 在 8081 (如果需要)
    // connectAuthEmulator(auth, `http://localhost:9099`);
    // connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, "localhost", 9199);
    // connectFunctionsEmulator(getFunctions(app), 'localhost', 5001); // 如果使用 Functions
    console.log("已連接到 Firebase 模擬器 (Storage)");
  } catch (error) {
    console.error("連接到 Firebase 模擬器失敗:", error);
  }
}

// --- App Check 初始化 ---
let appCheckInstance: AppCheck | null = null; // 使用 AppCheck 型別
let appCheckInitialized = false;
let appCheckError: Error | null = null;
let appCheckPromise: Promise<void> | null = null;

/**
 * 初始化 Firebase App Check
 */
export async function initializeFirebaseAppCheck(): Promise<void> {
  // 僅在瀏覽器環境執行
  if (typeof window === "undefined") {
    return;
  }

  // 如果已經有正在進行的初始化，返回該 Promise
  if (appCheckPromise) {
    console.log("App Check 正在初始化中，等待完成...");
    return appCheckPromise;
  }

  // 如果已經初始化完成，直接返回 (無論成功或失敗，避免重複初始化)
  if (appCheckInitialized) {
    console.log("App Check 已經初始化完成。");
    if (appCheckError) {
       console.error("App Check 初始化曾失敗，再次拋出錯誤。");
       throw appCheckError; // 如果之前失敗了，再次拋出錯誤
    }
    return;
  }

  // 創建新的初始化 Promise
  appCheckPromise = (async () => {
    try {
      console.log("開始初始化 App Check...");
      // 檢查是否有提供 SITE_KEY
      if (!APP_CHECK_CONFIG.SITE_KEY) {
         const error = new Error("Firebase App Check requires a ReCAPTCHA v3 site key. Please provide APP_CHECK_CONFIG.SITE_KEY.");
         console.error(error.message);
         throw error;
      }

      appCheckInstance = initializeAppCheck(firebaseApp, {
        provider: new ReCaptchaV3Provider(APP_CHECK_CONFIG.SITE_KEY),
        isTokenAutoRefreshEnabled: true, // 啟用 token 自動刷新
      });

      // 在本地開發時，如果偵測到 localhost 並且有提供 debug token，可以設定
      // 注意：debug token 需手動在 Firebase Console 中加入
      if (
        FIREBASE_EMULATOR.ENABLED &&
        typeof (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN !== "undefined"
      ) {
         console.log("偵測到 DEBUG_TOKEN，設定 App Check 模擬器模式。");
         // connectAppCheckEmulator(appCheckInstance, 'http://localhost:8081'); // 如果有運行 App Check 模擬器
      }


      appCheckInitialized = true;
      appCheckError = null;
      console.log("App Check 初始化成功！");

    } catch (error) {
      console.error("App Check 初始化失敗:", error);
      appCheckError = error as Error; // 儲存錯誤狀態
      throw error; // 拋出錯誤，讓外部可以捕獲
    } finally {
      appCheckPromise = null; // 初始化 Promise 完成，清除
    }
  })();

  return appCheckPromise; // 返回 Promise，讓呼叫者可以 await
}

/**
 * 取得 App Check token
 * 會先嘗試初始化 App Check 如果尚未初始化
 */
export async function getAppCheckToken(): Promise<string | null> {
  if (!appCheckInitialized || appCheckError) {
    console.log("嘗試在獲取 token 前初始化 App Check...");
    try {
      await initializeFirebaseAppCheck();
    } catch (initError) {
      console.error("App Check 初始化失敗，無法獲取 token。", initError);
      throw initError; // 初始化失敗，拋出錯誤
    }
  }

  // 如果初始化後仍有錯誤或實例為空，則無法獲取 token
  if (!appCheckInstance || appCheckError) {
     console.error("App Check 未成功初始化，無法獲取 token。");
     throw new Error("App Check is not initialized."); // 確保拋出錯誤而不是返回 null
  }

  try {
    console.log("正在獲取 App Check token...");
    const tokenResult = await getToken(appCheckInstance);
    console.log("成功獲取 App Check token。");
    return tokenResult.token;
  } catch (error) {
    console.error("取得 App Check token 失敗:", error);
    // 根據需要選擇拋出錯誤或返回 null
    // 返回 null 可能是可以接受的，如果 App Check 不是必須的
    // 如果是必須的，最好拋出錯誤
    // 這裡選擇拋出錯誤，讓呼叫方處理
    throw error;
  }
}

/**
 * 檢查 App Check 是否已初始化成功
 */
export function isAppCheckInitializedSuccessfully(): boolean {
  return appCheckInitialized && appCheckError === null;
}

/**
 * 取得 App Check 狀態
 */
export function getAppCheckStatus(): {
  initialized: boolean;
  error: Error | null;
  isInitializing: boolean;
} {
  return {
    initialized: appCheckInitialized,
    error: appCheckError,
    isInitializing: !!appCheckPromise, // 檢查是否有正在進行的初始化 Promise
  };
}

// 匯出需要的 Firebase 函數和類別
export {
  GoogleAuthProvider,
  signInWithPopup,
  getIdToken,
  onAuthStateChanged,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  getRedirectResult,
};

export type { User };

// 匯出 Firestore 相關函數
export {
  collection,
  doc,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAt,
  startAfter,
  endAt,
  endBefore,
  onSnapshot,
  writeBatch,
  runTransaction,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
};
