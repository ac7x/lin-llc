'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePermission } from '@/app/settings/hooks/use-permission';
import { useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function ModeToggle() {
  const { setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">切換主題</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          淺色模式
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          深色模式
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          跟隨系統
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function HomePage() {
  const { user, loading } = useAuth();
  const { 
    userProfile, 
    allUsers, 
    loadAllUsers, 
    pointsLeaderboard, 
    loadPointsLeaderboard,
    userPoints,
    loadUserPoints
  } = usePermission();

  useEffect(() => {
    if (userProfile?.uid) {
      void loadAllUsers();
      void loadPointsLeaderboard(10);
      void loadUserPoints(userProfile.uid);
    }
  }, [userProfile?.uid, loadAllUsers, loadPointsLeaderboard, loadUserPoints]);

  const onlineUsers = allUsers.filter(user => user.isOnline);
  const recentUsers = allUsers
    .sort((a, b) => new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">正在載入...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 導航欄 */}
      <nav className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">LIN LLC</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground">
                    歡迎，{user.displayName || user.email}
                  </span>
                  <Link href="/user/account">
                    <Button variant="outline" size="sm">
                      我的帳戶
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href="/user/account/signin">
                  <Button size="sm">
                    登入
                  </Button>
                </Link>
              )}
              <ModeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* 主要內容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            歡迎使用 LIN LLC 企業管理系統
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            現代化的企業管理平台，提供財務管理、專案追蹤和 AI 助手功能，
            讓您的企業運營更加高效和安全。
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                💰 財務管理
              </CardTitle>
              <CardDescription>
                完整的財務追蹤和管理系統
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                追蹤收入、支出、預算和財務報表，提供詳細的財務分析。
              </p>
              <Link href="/user/finance">
                <Button variant="outline" className="w-full">
                  進入財務管理
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                📋 專案管理
              </CardTitle>
              <CardDescription>
                高效的專案追蹤和協作工具
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                管理專案進度、任務分配、時間追蹤和團隊協作。
              </p>
              <Link href="/user/project">
                <Button variant="outline" className="w-full">
                  進入專案管理
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                🤖 AI 助手
              </CardTitle>
              <CardDescription>
                智能化的業務助手
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                基於 Google Gemini 的 AI 助手，協助您處理各種業務需求。
              </p>
              <Link href="/user/gemini">
                <Button variant="outline" className="w-full">
                  使用 AI 助手
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* 安全特色 */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              🔒 安全保護
            </CardTitle>
            <CardDescription>
              企業級安全防護
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-semibold">App Check 保護</h4>
                <p className="text-sm text-muted-foreground">
                  所有操作都受到 Firebase App Check 保護，防止惡意攻擊和濫用。
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Google 安全登入</h4>
                <p className="text-sm text-muted-foreground">
                  使用 Google 帳戶安全登入，無需記住額外的密碼。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 行動呼籲 */}
        {!user && (
          <div className="text-center mt-12">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">準備開始了嗎？</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  立即登入開始使用我們的企業管理系統
                </p>
                <Link href="/user/account/signin">
                  <Button className="w-full">
                    立即登入
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">企業管理系統</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline">積分: {userPoints}</Badge>
              {userProfile?.isOnline && (
                <Badge variant="default" className="bg-green-500">在線</Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 用戶總數 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">用戶總數</CardTitle>
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{allUsers.length}</div>
                <p className="text-xs text-muted-foreground">
                  活躍用戶: {allUsers.filter(u => u.isActive).length}
                </p>
              </CardContent>
            </Card>

            {/* 在線用戶 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">在線用戶</CardTitle>
                <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{onlineUsers.length}</div>
                <p className="text-xs text-muted-foreground">
                  活躍度: {allUsers.length > 0 ? Math.round((onlineUsers.length / allUsers.length) * 100) : 0}%
                </p>
              </CardContent>
            </Card>

            {/* 用戶積分 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">我的積分</CardTitle>
                <svg className="h-4 w-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{userPoints}</div>
                <p className="text-xs text-muted-foreground">
                  排名: {pointsLeaderboard.findIndex(u => u.uid === userProfile?.uid) + 1 || '未上榜'}
                </p>
              </CardContent>
            </Card>

            {/* 系統狀態 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">系統狀態</CardTitle>
                <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">正常</div>
                <p className="text-xs text-muted-foreground">
                  最後更新: {new Date().toLocaleTimeString('zh-TW')}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 積分排行榜 */}
            <Card>
              <CardHeader>
                <CardTitle>積分排行榜</CardTitle>
                <CardDescription>前 10 名用戶積分排行</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pointsLeaderboard.map((user, index) => (
                    <div key={user.uid} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                          {index + 1}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.photoURL} alt={user.displayName} />
                          <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.displayName}</p>
                          <p className="text-sm text-muted-foreground">積分: {user.points}</p>
                        </div>
                      </div>
                      {index < 3 && (
                        <Badge variant={index === 0 ? "default" : index === 1 ? "secondary" : "outline"}>
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                        </Badge>
                      )}
                    </div>
                  ))}
                  {pointsLeaderboard.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">暫無積分數據</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 最近上線 */}
            <Card>
              <CardHeader>
                <CardTitle>最近上線</CardTitle>
                <CardDescription>最近登入的用戶</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentUsers.map((user) => (
                    <div key={user.uid} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.photoURL} alt={user.displayName} />
                          <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.displayName}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(user.lastLoginAt), { 
                              addSuffix: true, 
                              locale: zhTW 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.isOnline && (
                          <Badge variant="default" className="bg-green-500">在線</Badge>
                        )}
                        <Badge variant="outline">積分: {user.points || 0}</Badge>
                      </div>
                    </div>
                  ))}
                  {recentUsers.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">暫無用戶數據</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
