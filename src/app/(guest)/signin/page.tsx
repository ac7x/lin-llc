'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Shield, Loader2, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useGoogleAuth, useAuthRedirect } from '@/app/(system)';

export default function SignInPage() {
  const { user, loading, error, signInWithGoogle, signOut } = useGoogleAuth();
  const { loading: redirectLoading, error: redirectError } = useAuthRedirect();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsRetrying(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsRetrying(false);
    }
  };

  // 載入狀態
  if (loading || redirectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-100 to-base-200">
        <Card className="w-full max-w-md shadow-lg border border-base-300">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Shield className="h-12 w-12 text-primary animate-pulse" />
                <div className="absolute -bottom-1 -right-1">
                  <Loader2 className="h-4 w-4 text-secondary animate-spin" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-medium">正在初始化系統</h3>
                <p className="text-sm text-muted-foreground">
                  正在載入企業級權限管理系統...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 已登入狀態
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-100 to-base-200 p-4">
        <Card className="w-full max-w-md shadow-lg border border-base-300">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary-content" />
            </div>
            <CardTitle className="text-xl">歡迎回來！</CardTitle>
            <CardDescription>
              您已成功登入企業權限管理系統
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* 用戶資訊卡片 */}
            <div className="p-4 bg-gradient-to-r from-base-200 to-base-100 rounded-lg border border-base-300">
              <div className="flex items-center space-x-3">
                {user.photoURL && (
                  <div className="relative">
                    <Image 
                      src={user.photoURL} 
                      alt="用戶頭像" 
                      width={48}
                      height={48}
                      className="rounded-full border-2 border-primary/20"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium truncate">{user.displayName}</p>
                    <Badge variant="secondary" className="text-xs">已驗證</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            </div>

            {/* 系統狀態 */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-base-100 rounded-lg border border-base-300">
                <Shield className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">安全認證</p>
              </div>
              <div className="p-3 bg-base-100 rounded-lg border border-base-300">
                <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">權限載入</p>
              </div>
              <div className="p-3 bg-base-100 rounded-lg border border-base-300">
                <div className="h-5 w-5 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto mb-1"></div>
                <p className="text-xs text-muted-foreground">系統就緒</p>
              </div>
            </div>

            <Separator />
            
            <Button 
              onClick={signOut} 
              variant="outline" 
              className="w-full h-11"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {loading ? '登出中...' : '安全登出'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 登入頁面
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-100 to-base-200 p-4">
      <Card className="w-full max-w-md shadow-lg border border-base-300">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary-content" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl">企業權限管理系統</CardTitle>
            <CardDescription>
              使用 Google 帳戶安全登入
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 錯誤訊息 */}
          {(error || redirectError) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="space-y-3">
                <p>{error || redirectError}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                  <span>{isRetrying ? '重試中...' : '重試登入'}</span>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Google 登入按鈕 */}
          <Button 
            onClick={handleGoogleSignIn} 
            className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm"
            disabled={loading || isRetrying}
          >
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path 
                  fill="#4285F4" 
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path 
                  fill="#34A853" 
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path 
                  fill="#FBBC05" 
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path 
                  fill="#EA4335" 
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading || isRetrying ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>登入中...</span>
                </div>
              ) : (
                <span>使用 Google 登入</span>
              )}
            </div>
          </Button>

          <Separator />

          {/* 系統特色 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-center">企業級權限管理特色</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center space-x-2 p-2 bg-base-100 rounded border border-base-300">
                <Shield className="w-3 h-3 text-primary" />
                <span>RBAC 權限控制</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-base-100 rounded border border-base-300">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span>多層級角色</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-base-100 rounded border border-base-300">
                <div className="w-3 h-3 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
                <span>資料範圍控制</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-base-100 rounded border border-base-300">
                <AlertTriangle className="w-3 h-3 text-yellow-500" />
                <span>App Check 保護</span>
              </div>
            </div>
          </div>

          {/* 登入說明 */}
          {error && (
            <div className="text-xs text-muted-foreground space-y-1 p-3 bg-base-100 rounded-lg border border-base-300">
              <p className="font-medium">故障排除建議：</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>請確保允許彈出視窗</li>
                <li>檢查網路連線是否穩定</li>
                <li>清除瀏覽器快取後重試</li>
                <li>如問題持續，系統會自動使用重定向登入</li>
              </ul>
            </div>
          )}

          {/* 安全說明 */}
          <div className="text-xs text-muted-foreground text-center space-y-1 p-3 bg-gradient-to-r from-base-100 to-base-200 rounded-lg border border-base-300">
            <p>🔒 此系統受到 Firebase App Check 和 reCAPTCHA v3 雙重保護</p>
            <p>⚡ 採用企業級三層架構，確保資料安全與系統穩定</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
