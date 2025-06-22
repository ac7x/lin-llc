// components/firebase/FirebaseProvider.tsx
"use client"; // 宣告這是一個 Client Component

import { useEffect, useState, createContext, useContext, ReactNode, useCallback } from 'react';
import { initializeApp, FirebaseApp } from "firebase/app";
// 從 firebase/app-check 導入 AppCheck 類型
// 不再導入 getAppCheck 或 getToken 函數，直接依賴 AppCheck 實例
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck } from "firebase/app-check";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User, Auth, IdTokenResult } from "firebase/auth";
import { UserRole, hasRequiredRole, ROLE_LEVELS } from '../../types/roles'; // 導入角色定義

// 定義 Context 的型別
interface FirebaseContextType {
  firebaseApp: FirebaseApp | null;
  authInstance: Auth | null;
  currentUser: User | null;
  currentUserClaims: IdTokenResult['claims'] | null; // 用於儲存用戶的自訂聲明
  currentRole: UserRole; // 解析後的用戶角色
  hasRole: (requiredRole: UserRole) => boolean; // 檢查用戶是否具有所需角色
  appCheckInstance: AppCheck | null; // 保持 AppCheck 類型
  signInWithGoogle: () => Promise<{ idToken: string | null; appCheckToken: string | null; } | null>;
  signOutUser: () => Promise<void>;
  getTokensForServerAction: () => Promise<{ idToken: string | null; appCheckToken: string | null; } | null>;
  refreshIdToken: () => Promise<void>; // 用於手動刷新 ID Token (當自訂聲明被修改時)
  loading: boolean; // Firebase 服務初始化和使用者狀態加載中
}

// 建立 Context
const FirebaseContext = createContext<FirebaseContextType>({
  firebaseApp: null,
  authInstance: null,
  currentUser: null,
  currentUserClaims: null,
  currentRole: UserRole.GUEST,
  hasRole: () => false,
  appCheckInstance: null,
  signInWithGoogle: async () => null,
  signOutUser: async () => {},
  getTokensForServerAction: async () => null,
  refreshIdToken: async () => {},
  loading: true,
});

// 自定義 Hook，方便在客戶端組件中使用 Firebase Context
export const useFirebase = () => useContext(FirebaseContext);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [firebaseApp, setFirebaseApp] = useState<FirebaseApp | null>(null);
  const [authInstance, setAuthInstance] = useState<Auth | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserClaims, setCurrentUserClaims] = useState<IdTokenResult['claims'] | null>(null);
  const [appCheckInstance, setAppCheckInstance] = useState<AppCheck | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化 Firebase App, Auth, App Check
  useEffect(() => {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

    // 確保 Firebase App 只初始化一次
    let app: FirebaseApp;
    if (!firebaseApp) {
      app = initializeApp(firebaseConfig);
      setFirebaseApp(app);
    } else {
      app = firebaseApp;
    }

    const auth = getAuth(app);
    setAuthInstance(auth);

    // 監聽使用者登入狀態和獲取 ID Token Claims
    const unsubscribeAuth = auth.onIdTokenChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult();
          setCurrentUserClaims(idTokenResult.claims);
          console.log("User logged in. Claims:", idTokenResult.claims);
        } catch (error) {
          console.error("Error getting ID token result:", error);
          setCurrentUserClaims(null);
        }
      } else {
        setCurrentUserClaims(null);
        console.log("User logged out.");
      }
      setLoading(false); // 在首次加載時設置 loading 為 false
    });

    // 初始化 App Check (僅在瀏覽器環境中)
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
      const appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
        // debug: process.env.NODE_ENV === 'development', // 僅在開發環境啟用偵錯
      });
      setAppCheckInstance(appCheck);
    } else {
      setLoading(false); // 如果 App Check 無法初始化，也要設置 loading 為 false
    }

    return () => {
      unsubscribeAuth(); // 清理 onIdTokenChanged 訂閱
    };
  }, [firebaseApp]);

  // Google 登入方法
  const signInWithGoogle = useCallback(async () => {
    if (!authInstance || !appCheckInstance) { // 這裡確保 appCheckInstance 已初始化
      console.warn("Firebase Auth or App Check not initialized.");
      return null;
    }
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(authInstance, provider);
      const user = result.user;

      const idToken = await user.getIdToken(); // 獲取使用者 ID Token
      // 直接從 appCheckInstance 獲取令牌。如果 TypeScript 仍報錯，使用 `as any`
      const appCheckTokenResult = await (appCheckInstance as any).getToken(true);
      const appCheckToken = appCheckTokenResult.token;

      console.log("Google Sign-In successful. ID Token acquired, App Check Token acquired.");
      return { idToken, appCheckToken };
    } catch (error) {
      console.error("Google Sign-In or token retrieval failed:", error);
      return null;
    }
  }, [authInstance, appCheckInstance]); // 依賴 appCheckInstance

  // 登出方法
  const signOutUser = useCallback(async () => {
    if (authInstance) {
      try {
        await signOut(authInstance);
        console.log("User signed out.");
      } catch (error) {
        console.error("Error signing out:", error);
      }
    }
  }, [authInstance]);

  // 獲取 App Check 和 ID 令牌以傳遞給 Server Action
  const getTokensForServerAction = useCallback(async () => {
    if (!authInstance || !appCheckInstance || !currentUser) { // 這裡確保 appCheckInstance 已初始化
      console.warn("User not logged in or Firebase services not ready.");
      return null;
    }
    try {
      const idToken = await currentUser.getIdToken();
      // 直接從 appCheckInstance 獲取令牌。如果 TypeScript 仍報錯，使用 `as any`
      const appCheckTokenResult = await (appCheckInstance as any).getToken(true);
      const appCheckToken = appCheckTokenResult.token;
      return { idToken, appCheckToken };
    } catch (error) {
      console.error("Failed to get tokens for server action:", error);
      return null;
    }
  }, [authInstance, appCheckInstance, currentUser]); // 依賴 appCheckInstance

  // 手動刷新 ID Token (當自訂聲明在後端被修改時，前端需要刷新才能獲取最新聲明)
  const refreshIdToken = useCallback(async () => {
    if (currentUser) {
      try {
        await currentUser.getIdToken(true); // true 強制刷新
        console.log("ID Token refreshed.");
      } catch (error) {
        console.error("Error refreshing ID Token:", error);
      }
    }
  }, [currentUser]);

  // 從 claims 中解析當前角色
  // 使用類型斷言確保 currentUserClaims.role 被正確處理為 UserRole
  const currentRole = (currentUserClaims?.role as UserRole) || UserRole.GUEST;

  // 檢查用戶是否具有所需角色
  const hasRole = useCallback((requiredRole: UserRole) => {
    return hasRequiredRole(currentRole, requiredRole);
  }, [currentRole]);

  // 如果 Firebase 相關服務仍在加載中，顯示加載狀態
  if (loading) {
    return <div>Loading Firebase services and user data...</div>;
  }

  return (
    <FirebaseContext.Provider
      value={{
        firebaseApp,
        authInstance,
        currentUser,
        currentUserClaims,
        currentRole,
        hasRole,
        appCheckInstance,
        signInWithGoogle,
        signOutUser,
        getTokensForServerAction,
        refreshIdToken,
        loading,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}
