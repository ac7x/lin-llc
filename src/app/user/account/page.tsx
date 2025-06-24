// src/app/user/account/signin/page.tsx
'use client'; // 標記為 Client Component

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase-init';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { logError } from '@/utils/errorUtils';

export default function SignInPage() {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 監聽用戶登入狀態
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Google 登入
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/user/account'); // 登入成功後跳轉
    } catch (error) {
      logError(error, { operation: 'google_sign_in' });
    } finally {
      setLoading(false);
    }
  };

  // 登出
  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut(auth);
    } catch (error) {
      logError(error, { operation: 'sign_out' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {user ? '帳戶管理' : '登入您的帳戶'}
          </CardTitle>
          <CardDescription className="text-center">
            {user ? `歡迎回來，${user.displayName || '用戶'}` : '請選擇登入方式'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {user ? (
            <>
              <Button 
                onClick={handleSignOut} 
                disabled={loading}
                className="w-full"
              >
                {loading ? '處理中...' : '登出'}
              </Button>
            </>
          ) : (
            <Button 
              onClick={handleGoogleSignIn} 
              disabled={loading}
              className="w-full"
            >
              {loading ? '處理中...' : '使用 Google 登入'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}