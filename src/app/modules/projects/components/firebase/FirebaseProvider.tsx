// components/firebase/FirebaseProvider.tsx
"use client"; // 宣告這是一個 Client Component

import { useEffect, useState, createContext, useContext, ReactNode, useCallback } from 'react';
import { initializeApp, FirebaseApp } from "firebase/app";
// 從 firebase/app-check 導入 AppCheck 類型和 getToken 函數
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck, getToken } from "firebase/app-check";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User, Auth, IdTokenResult } from "firebase/auth";
import { UserRole, hasRequiredRole, ROLE_LEVELS } from '../../types/roles'; // 導入角色定義
import { syncUserProfile, getUserProfile, type UserProfile } from '../../actions/userManagement'; // 導入用戶管理功能

// 定義 Context 的型別
interface FirebaseContextType {
  firebaseApp: FirebaseApp | null;
  authInstance: Auth | null;
  currentUser: User | null;
  currentUserClaims: IdTokenResult['claims'] | null; // 用於儲存用戶的自訂聲明
  currentRole: UserRole; // 解析後的用戶角色
  userProfile: UserProfile | null; // 用戶資料
  hasRole: (requiredRole: UserRole) => boolean; // 檢查用戶是否具有所需角色
  appCheckInstance: AppCheck | null; // 保持 AppCheck 類型
  signInWithGoogle: () => Promise<{ idToken: string | null; appCheckToken: string | null; } | null>;
  signOutUser: () => Promise<void>;
  getTokensForServerAction: () => Promise<{ idToken: string | null; appCheckToken: string | null; } | null>;
  refreshIdToken: () => Promise<void>; // 用於手動刷新 ID Token (當自訂聲明被修改時)
  refreshUserProfile: () => Promise<void>; // 刷新用戶資料
  loading: boolean; // Firebase 服務初始化和使用者狀態加載中
  isSigningIn: boolean; // 登入進行中狀態
}

// 建立 Context
const FirebaseContext = createContext<FirebaseContextType>({
  firebaseApp: null,
  authInstance: null,
  currentUser: null,
  currentUserClaims: null,
  currentRole: UserRole.GUEST,
  userProfile: null,
  hasRole: () => false,
  appCheckInstance: null,
  signInWithGoogle: async () => null,
  signOutUser: async () => {},
  getTokensForServerAction: async () => null,
  refreshIdToken: async () => {},
  refreshUserProfile: async () => {},
  loading: true,
  isSigningIn: false,
});

// 自定義 Hook，方便在客戶端組件中使用 Firebase Context
export const useFirebase = () => useContext(FirebaseContext);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [firebaseApp, setFirebaseApp] = useState<FirebaseApp | null>(null);
  const [authInstance, setAuthInstance] = useState<Auth | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserClaims, setCurrentUserClaims] = useState<IdTokenResult['claims'] | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [appCheckInstance, setAppCheckInstance] = useState<AppCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false); // 添加登入狀態追蹤

  // 同步用戶資料到 Firestore
  const syncUserToFirestore = useCallback(async (user: User) => {
    try {
      const tokens = await getTokensForServerAction();
      if (!tokens?.idToken || !tokens?.appCheckToken) {
        console.warn("無法獲取令牌，跳過用戶資料同步");
        return;
      }

      await syncUserProfile({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || undefined,
      }, tokens.appCheckToken, tokens.idToken);
      
      console.log("用戶資料已同步到 Firestore");
    } catch (error) {
      console.error("同步用戶資料失敗:", error);
    }
  }, []);

  // 獲取用戶資料
  const loadUserProfile = useCallback(async (user: User) => {
    try {
      const tokens = await getTokensForServerAction();
      if (!tokens?.idToken || !tokens?.appCheckToken) {
        console.warn("無法獲取令牌，跳過載入用戶資料");
        return;
      }

      const result = await getUserProfile(user.uid, tokens.appCheckToken, tokens.idToken);
      if (result.status === 'success' && result.profile) {
        setUserProfile(result.profile);
      }
    } catch (error) {
      console.error("載入用戶資料失敗:", error);
    }
  }, []);

  // 獲取 App Check 和 ID 令牌以傳遞給 Server Action
  const getTokensForServerAction = useCallback(async () => {
    if (!authInstance || !appCheckInstance || !currentUser) {
      console.warn("User not logged in or Firebase services not ready.");
      return null;
    }
    try {
      const idToken = await currentUser.getIdToken();
      // 使用正確的 Firebase v11 API 獲取 App Check Token
      const appCheckTokenResult = await getToken(appCheckInstance, true);
      const appCheckToken = appCheckTokenResult.token;
      return { idToken, appCheckToken };
    } catch (error) {
      console.error("Failed to get tokens for server action:", error);
      return null;
    }
  }, [authInstance, appCheckInstance, currentUser]);

  // 刷新用戶資料
  const refreshUserProfile = useCallback(async () => {
    if (currentUser) {
      await loadUserProfile(currentUser);
    }
  }, [currentUser, loadUserProfile]);

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
          
          // 同步用戶資料到 Firestore
          await syncUserToFirestore(user);
          
          // 載入用戶資料
          await loadUserProfile(user);
        } catch (error) {
          console.error("Error getting ID token result:", error);
          setCurrentUserClaims(null);
        }
      } else {
        setCurrentUserClaims(null);
        setUserProfile(null);
        console.log("User logged out.");
      }
      setLoading(false); // 在首次加載時設置 loading 為 false
    });

    // 初始化 App Check (僅在瀏覽器環境中)
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
      try {
        const appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
          isTokenAutoRefreshEnabled: true,
        });
        setAppCheckInstance(appCheck);
      } catch (error) {
        console.error("App Check 初始化失敗:", error);
      }
    } else {
      setLoading(false); // 如果 App Check 無法初始化，也要設置 loading 為 false
    }

    return () => {
      unsubscribeAuth(); // 清理 onIdTokenChanged 訂閱
    };
  }, [firebaseApp, syncUserToFirestore, loadUserProfile]);

  // Google 登入方法
  const signInWithGoogle = useCallback(async () => {
    if (!authInstance || !appCheckInstance) {
      console.error("Firebase Auth 或 App Check 未初始化");
      return null;
    }

    // 防止重複點擊
    if (isSigningIn) {
      console.log("登入進行中，請稍候...");
      return null;
    }

    setIsSigningIn(true);

    try {
      const provider = new GoogleAuthProvider();
      // 添加額外的範圍（可選）
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(authInstance, provider);
      const user = result.user;

      const idToken = await user.getIdToken();
      
      // 使用正確的 Firebase v11 API 獲取 App Check Token
      let appCheckToken: string | null = null;
      try {
        const tokenResult = await getToken(appCheckInstance, /* forceRefresh */ true);
        appCheckToken = tokenResult.token;
      } catch (appCheckError) {
        console.error("App Check Token 獲取失敗:", appCheckError);
      }

      return { idToken, appCheckToken };
    } catch (error: any) {
      // 處理特定的 Firebase 錯誤
      if (error.code === 'auth/cancelled-popup-request') {
        console.log("登入彈出視窗被取消，可能是重複點擊或彈出視窗被阻擋");
        return null;
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.log("用戶關閉了登入彈出視窗");
        return null;
      } else if (error.code === 'auth/popup-blocked') {
        console.error("登入彈出視窗被瀏覽器阻擋，請允許彈出視窗");
        alert("請允許瀏覽器彈出視窗以完成登入");
        return null;
      } else {
        console.error("Google 登入失敗:", error);
        return null;
      }
    } finally {
      setIsSigningIn(false);
    }
  }, [authInstance, appCheckInstance, isSigningIn]);

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
        userProfile,
        hasRole,
        appCheckInstance,
        signInWithGoogle,
        signOutUser,
        getTokensForServerAction,
        refreshIdToken,
        refreshUserProfile,
        loading,
        isSigningIn,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}
