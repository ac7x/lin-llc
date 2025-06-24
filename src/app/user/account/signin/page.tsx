'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';

export default function SignInPage() {
  const {
    user,
    userLoading,
    appCheckInitialized,
    appCheckValid,
    appCheckError,
    appCheckLoading,
    signInWithGoogle,
    signOut,
    signInLoading,
    signInError,
    redirectLoading,
    redirectError,
  } = useAuth();

  const loading = userLoading || signInLoading || redirectLoading || appCheckLoading;
  const error = signInError || redirectError || appCheckError;

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // 顯示載入狀態
  if (loading || !appCheckInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">
            {!appCheckInitialized ? '正在初始化安全驗證...' :
              appCheckLoading ? '正在驗證安全狀態...' : '正在載入...'}
          </span>
        </div>
      </div>
    );
  }

  // 如果已登入，顯示用戶資訊
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-4">
            <div className="text-2xl font-bold">歡迎回來！</div>
            <div className="text-muted-foreground">您已成功登入</div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg mb-4">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt="用戶頭像"
                width={40}
                height={40}
                className="rounded-full"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full h-10 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            {loading ? '登出中...' : '登出'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-4">
          <div className="text-2xl font-bold">登入您的帳戶</div>
          <div className="text-muted-foreground">使用 Google 帳戶安全登入</div>
        </div>
        <div className="space-y-4">
          {/* 錯誤訊息 */}
          {error && (
            <div className="bg-red-100 text-red-700 rounded p-2 text-sm mb-2">
              {error}
            </div>
          )}

          {/* App Check 狀態提示 */}
          {!appCheckValid && appCheckInitialized && (
            <div className="bg-yellow-100 text-yellow-700 rounded p-2 text-sm mb-2">
              安全驗證未通過，請重新整理頁面後重試
            </div>
          )}

          {/* Google 登入按鈕 */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full h-12 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center"
            disabled={loading || !appCheckValid}
          >
            <svg
              className="w-5 h-5 mr-2"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loading ? '登入中...' : '使用 Google 登入'}
          </button>

          {/* 安全提示 */}
          <div className="text-xs text-muted-foreground text-center mt-2">
            <p>此登入過程受到 App Check 保護</p>
            <p>您的資料安全是我們的首要任務</p>
          </div>
        </div>
      </div>
    </div>
  );
}
