'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';

export default function AccountPage() {
  const { user, loading, error, signOut } = useGoogleAuth();
  const { 
    userLoading, 
    appCheckInitialized, 
    appCheckValid, 
    appCheckError,
    appCheckLoading 
  } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  // 顯示載入狀態
  if (loading || userLoading || !appCheckInitialized || appCheckLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">
                {!appCheckInitialized ? '正在初始化安全驗證...' : 
                 appCheckLoading ? '正在驗證安全狀態...' : '正在載入...'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 如果未登入，顯示登入提示
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>需要登入</CardTitle>
            <CardDescription>
              請先登入以查看您的帳戶資訊
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 錯誤訊息 */}
            {(error || appCheckError) && (
              <Alert variant="destructive">
                <AlertDescription>
                  {error || appCheckError}
                </AlertDescription>
              </Alert>
            )}

            <Link href="/user/account/signin">
              <Button className="w-full">
                前往登入
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">我的帳戶</h1>
          <p className="text-muted-foreground">管理您的帳戶資訊和設定</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 用戶資訊卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>個人資訊</CardTitle>
              <CardDescription>
                您的 Google 帳戶資訊
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                {user.photoURL && (
                  <Image 
                    src={user.photoURL} 
                    alt="用戶頭像" 
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{user.displayName || '未設定名稱'}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    用戶 ID: {user.uid}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">電子郵件驗證:</span>
                  <span className={user.emailVerified ? 'text-green-600' : 'text-red-600'}>
                    {user.emailVerified ? '已驗證' : '未驗證'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">註冊時間:</span>
                  <span>{user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('zh-TW') : '未知'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">最後登入:</span>
                  <span>{user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString('zh-TW') : '未知'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 帳戶操作卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>帳戶操作</CardTitle>
              <CardDescription>
                管理您的帳戶設定
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleSignOut} 
                variant="outline" 
                className="w-full"
                disabled={loading}
              >
                {loading ? '登出中...' : '登出帳戶'}
              </Button>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• 登出後將清除所有本地資料</p>
                <p>• 您可以隨時重新登入</p>
                <p>• 此操作受到 App Check 保護</p>
              </div>
            </CardContent>
          </Card>

          {/* 安全資訊卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>安全資訊</CardTitle>
              <CardDescription>
                您的帳戶安全狀態
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className={`flex items-center justify-between p-3 rounded-lg ${
                  appCheckValid ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'
                }`}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      appCheckValid ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-medium">App Check 保護</span>
                  </div>
                  <span className={`text-xs ${
                    appCheckValid ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {appCheckValid ? '已啟用' : '未通過'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">Google 登入</span>
                  </div>
                  <span className="text-xs text-blue-600">已連接</span>
                </div>

                {user.emailVerified && (
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">電子郵件驗證</span>
                    </div>
                    <span className="text-xs text-green-600">已驗證</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 快速連結卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>快速連結</CardTitle>
              <CardDescription>
                常用功能快速存取
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/user/finance">
                <Button variant="ghost" className="w-full justify-start">
                  💰 財務管理
                </Button>
              </Link>
              <Link href="/user/project">
                <Button variant="ghost" className="w-full justify-start">
                  📋 專案管理
                </Button>
              </Link>
              <Link href="/user/gemini">
                <Button variant="ghost" className="w-full justify-start">
                  🤖 AI 助手
                </Button>
              </Link>
              <Link href="/user/account/notifications">
                <Button variant="ghost" className="w-full justify-start">
                  🔔 通知設定
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
