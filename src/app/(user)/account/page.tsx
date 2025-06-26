'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGoogleAuth, useAuthRedirect } from '@/app/(system)';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/(system)/data/lib/firebase-init';
import type { UserProfile } from '@/app/settings/types';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SkillTagsInput } from '@/components/ui/skill-tags-input';

export default function AccountPage() {
  const { user, loading, error, signOut } = useGoogleAuth();
  const { loading: redirectLoading, error: redirectError } = useAuthRedirect();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editAlias, setEditAlias] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLineId, setEditLineId] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

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

  // 載入 Firestore 個人資料
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setProfile(data);
        setEditAlias(data.alias || '');
        setEditPhone(data.phone || '');
        setEditLineId(data.lineId || '');
      }
    };
    void fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  // 編輯個人資料
  const handleProfileSave = async () => {
    if (!user) return;
    setEditLoading(true);
    setEditSuccess(false);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        alias: editAlias.trim(),
        phone: editPhone.trim(),
        lineId: editLineId.trim(),
        skills: profile?.skills || [],
        updatedAt: new Date().toISOString(),
      });
      setProfile(prev => prev ? { 
        ...prev, 
        alias: editAlias.trim(), 
        phone: editPhone.trim(), 
        lineId: editLineId.trim() 
      } : prev);
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 2000);
    } catch (error) {
      console.error('儲存個人資料失敗:', error);
    } finally {
      setEditLoading(false);
    }
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
            {(error || redirectError) && (
              <Alert variant="destructive">
                <AlertDescription>
                  {error || redirectError}
                </AlertDescription>
              </Alert>
            )}

            <Link href="/account/signin">
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
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">App Check 保護</span>
                  </div>
                  <span className="text-xs text-green-600">已啟用</span>
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
              <Link href="/finance">
                <Button variant="ghost" className="w-full justify-start">
                  💰 財務管理
                </Button>
              </Link>
              <Link href="/project">
                <Button variant="ghost" className="w-full justify-start">
                  📋 專案管理
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" className="w-full justify-start">
                  🤖 AI 助手
                </Button>
              </Link>
              <Link href="/account/notifications">
                <Button variant="ghost" className="w-full justify-start">
                  🔔 通知設定
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 個人資料編輯卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>個人資料</CardTitle>
              <CardDescription>您可以自訂顯示名稱、聯絡電話與 Line ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="alias">別名</Label>
                    <Input
                      id="alias"
                      value={editAlias}
                      onChange={(e) => setEditAlias(e.target.value)}
                      placeholder="請輸入別名"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">聯絡電話</Label>
                    <Input
                      id="phone"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="請輸入聯絡電話"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lineId">Line ID</Label>
                  <Input
                    id="lineId"
                    value={editLineId}
                    onChange={(e) => setEditLineId(e.target.value)}
                    placeholder="請輸入 Line ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skills">技能標籤</Label>
                  <SkillTagsInput
                    value={profile?.skills || []}
                    onChange={skills => setProfile(prev => prev ? { ...prev, skills } : prev)}
                    placeholder="輸入技能後按 Enter 或逗號新增，可移除"
                  />
                  <p className="text-xs text-muted-foreground">
                    按 Enter 或逗號新增，點擊 X 可移除
                  </p>
                  {/* 顯示當前技能標籤 */}
                  {profile?.skills && profile.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Button onClick={handleProfileSave} disabled={editLoading}>
                  {editLoading ? '儲存中...' : '儲存變更'}
                </Button>
                {editSuccess && <span className="text-green-600 text-xs">已儲存！</span>}
              </div>
              {profile && (
                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                  <div>目前顯示名稱：<span className="font-medium">{profile.alias || '未設定'}</span></div>
                  <div>目前聯絡電話：<span className="font-medium">{profile.phone || '未設定'}</span></div>
                  <div>目前 Line ID：<span className="font-medium">{profile.lineId || '未設定'}</span></div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
