'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { useAuthRedirect } from '@/hooks/use-auth-redirect';

export default function SignInPage() {
  const { user, loading, error, signInWithGoogle, signOut } = useGoogleAuth();
  const { loading: redirectLoading, error: redirectError } = useAuthRedirect();

  // 初始化客戶端服務
  useEffect(() => {
    const initializeServices = async () => {
      try {
        const { initializeClientServices } = await import('@/lib/firebase-init');
        await initializeClientServices();
      } catch (error) {
        console.error('初始化客戶端服務失敗:', error);
      }
    };

    void initializeServices();
  }, []);

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // 顯示載入狀態
  if (loading || redirectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">正在載入...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 如果已登入，顯示用戶資訊
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>歡迎回來！</CardTitle>
            <CardDescription>
              您已成功登入
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              {user.photoURL && (
                <Image 
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
            
            <Button 
              onClick={handleSignOut} 
              variant="outline" 
              className="w-full"
              disabled={loading}
            >
              {loading ? '登出中...' : '登出'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>登入您的帳戶</CardTitle>
          <CardDescription>
            使用 Google 帳戶安全登入
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 錯誤訊息 */}
          {(error || redirectError) && (
            <Alert variant="destructive">
              <AlertDescription>
                {error || redirectError}
              </AlertDescription>
            </Alert>
          )}

          {/* Google 登入按鈕 */}
          <Button 
            onClick={handleGoogleSignIn} 
            variant="outline" 
            className="w-full h-12"
            disabled={loading}
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
          </Button>

          {/* 安全提示 */}
          <div className="text-xs text-muted-foreground text-center">
            <p>此登入過程受到 App Check 保護</p>
            <p>您的資料安全是我們的首要任務</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
