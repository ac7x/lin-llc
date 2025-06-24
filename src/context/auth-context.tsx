'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, GoogleAuthProvider, signInWithRedirect, signOut as firebaseSignOut, getRedirectResult, AuthError } from 'firebase/auth';
import { firebaseManager } from '@/lib/firebase-manager';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AuthContextType {
  // 用戶狀態
  user: User | null;
  userLoading: boolean;
  userError: string | null;
  
  // App Check 狀態
  appCheckInitialized: boolean;
  appCheckValid: boolean;
  appCheckLoading: boolean;
  appCheckError: string | null;
  
  // 登入狀態
  signInLoading: boolean;
  signInError: string | null;
  
  // 重定向狀態
  redirectLoading: boolean;
  redirectError: string | null;
  
  // 方法
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getAppCheckToken: (forceRefresh?: boolean) => Promise<string | null>;
  validateAppCheck: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // 用戶狀態
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  
  // App Check 狀態
  const [appCheckInitialized, setAppCheckInitialized] = useState(false);
  const [appCheckValid, setAppCheckValid] = useState(false);
  const [appCheckLoading, setAppCheckLoading] = useState(false);
  const [appCheckError, setAppCheckError] = useState<string | null>(null);
  
  // 登入狀態
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  
  // 重定向狀態
  const [redirectLoading, setRedirectLoading] = useState(false);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  // 1. 先初始化 App Check
  useEffect(() => {
    const init = async () => {
      setAppCheckLoading(true);
      try {
        await firebaseManager.initializeClientServices();
        await validateAppCheck();
      } catch (error) {
        setAppCheckError(error instanceof Error ? error.message : 'App Check 初始化失敗');
        setAppCheckValid(false);
        setAppCheckInitialized(true);
      } finally {
        setAppCheckLoading(false);
      }
    };
    void init();
  }, []);

  // 2. App Check 初始化完成後才註冊 Auth 監聽
  useEffect(() => {
    if (!appCheckInitialized) return;
    const unsubscribeAuth = firebaseManager.addAuthListener((user) => {
      setUser(user);
      setUserLoading(false);
      setUserError(null);
    });
    return unsubscribeAuth;
  }, [appCheckInitialized]);

  // 3. App Check 初始化完成後才處理重定向
  useEffect(() => {
    if (!appCheckInitialized) return;
    const handleRedirectResult = async () => {
      try {
        setRedirectLoading(true);
        setRedirectError(null);
        const result = await getRedirectResult(firebaseManager.getAuth());
        if (result) {
          console.log('重定向登入成功:', result.user.email);
        }
      } catch (err) {
        const authError = err as AuthError;
        console.error('重定向登入錯誤:', authError);
        switch (authError.code) {
          case 'auth/account-exists-with-different-credential':
            setRedirectError('此電子郵件已被其他方式註冊，請使用其他登入方式');
            break;
          case 'auth/invalid-credential':
            setRedirectError('登入憑證無效，請重新登入');
            break;
          case 'auth/operation-not-allowed':
            setRedirectError('此登入方式未啟用');
            break;
          case 'auth/user-disabled':
            setRedirectError('此帳戶已被停用');
            break;
          case 'auth/user-not-found':
            setRedirectError('找不到此帳戶');
            break;
          case 'auth/weak-password':
            setRedirectError('密碼強度不足');
            break;
          default:
            setRedirectError(authError.message || '登入失敗');
        }
      } finally {
        setRedirectLoading(false);
      }
    };
    void handleRedirectResult();
  }, [appCheckInitialized]);

  // 驗證 App Check
  const validateAppCheck = useCallback(async (): Promise<boolean> => {
    try {
      setAppCheckLoading(true);
      setAppCheckError(null);
      const isValid = await firebaseManager.validateAppCheck();
      setAppCheckValid(isValid);
      setAppCheckInitialized(true);
      if (!isValid) {
        setAppCheckError('App Check 驗證失敗');
      }
      return isValid;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'App Check 驗證失敗';
      setAppCheckError(errorMessage);
      setAppCheckValid(false);
      setAppCheckInitialized(true);
      return false;
    } finally {
      setAppCheckLoading(false);
    }
  }, []);

  // 定期檢查 App Check 狀態
  useEffect(() => {
    if (!appCheckInitialized) return;
    const checkAppCheckStatus = async () => {
      await validateAppCheck();
    };
    const interval = setInterval(checkAppCheckStatus, 30000); // 每30秒檢查一次
    void checkAppCheckStatus();
    return () => {
      clearInterval(interval);
    };
  }, [appCheckInitialized, validateAppCheck]);

  // 獲取 App Check Token
  const getAppCheckToken = useCallback(async (forceRefresh = false): Promise<string | null> => {
    try {
      return await firebaseManager.getAppCheckToken(forceRefresh);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '獲取 Token 失敗';
      setAppCheckError(errorMessage);
      return null;
    }
  }, []);

  // Google 登入
  const signInWithGoogle = useCallback(async () => {
    try {
      setSignInLoading(true);
      setSignInError(null);
      if (!appCheckInitialized) {
        throw new Error('App Check 正在初始化中，請稍後再試');
      }
      if (!appCheckValid) {
        throw new Error('App Check 驗證失敗，請重新整理頁面');
      }
      if (appCheckError) {
        throw new Error(`App Check 錯誤: ${appCheckError}`);
      }
      const token = await getAppCheckToken();
      if (!token) {
        throw new Error('App Check Token 獲取失敗');
      }
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithRedirect(firebaseManager.getAuth(), provider);
    } catch (err) {
      const authError = err as AuthError;
      console.error('Google 登入錯誤:', authError);
      switch (authError.code) {
        case 'auth/popup-closed-by-user':
          setSignInError('登入視窗被關閉，請重試');
          break;
        case 'auth/popup-blocked':
          setSignInError('彈出視窗被阻擋，請允許彈出視窗後重試');
          break;
        case 'auth/cancelled-popup-request':
          setSignInError('登入請求被取消');
          break;
        case 'auth/network-request-failed':
          setSignInError('網路連線失敗，請檢查網路連線');
          break;
        case 'auth/too-many-requests':
          setSignInError('請求過於頻繁，請稍後再試');
          break;
        default:
          setSignInError(authError.message || '登入失敗，請重試');
      }
    } finally {
      setSignInLoading(false);
    }
  }, [appCheckInitialized, appCheckValid, appCheckError, getAppCheckToken]);

  // 登出
  const signOut = useCallback(async () => {
    try {
      setSignInLoading(true);
      await firebaseSignOut(firebaseManager.getAuth());
    } catch (err) {
      const authError = err as AuthError;
      console.error('登出錯誤:', authError);
      setSignInError('登出失敗，請重試');
    } finally {
      setSignInLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    // 用戶狀態
    user,
    userLoading,
    userError,
    // App Check 狀態
    appCheckInitialized,
    appCheckValid,
    appCheckLoading,
    appCheckError,
    // 登入狀態
    signInLoading,
    signInError,
    // 重定向狀態
    redirectLoading,
    redirectError,
    // 方法
    signInWithGoogle,
    signOut,
    getAppCheckToken,
    validateAppCheck,
  };

  // loading/error UI 控制
  const loading =
    userLoading || appCheckLoading || signInLoading || redirectLoading || !appCheckInitialized;
  const error = appCheckError || signInError || redirectError;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">
                {!appCheckInitialized
                  ? '正在初始化安全驗證...'
                  : appCheckLoading
                  ? '正在驗證安全狀態...'
                  : '正在載入...'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 