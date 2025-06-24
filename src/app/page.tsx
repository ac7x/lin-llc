'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';

export default function HomePage() {
  const { user, userLoading } = useAuth();

  if (userLoading) {
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
      </main>
    </div>
  );
}
