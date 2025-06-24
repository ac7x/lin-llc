'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRedirectResult } from 'firebase/auth';
import { useAuth } from '@/context/auth-provider';
import { signInWithGoogle } from '@/lib/firebase-auth';
import { auth } from '@/lib/firebase-init';
import { Button } from '@/components/ui/button';

export default function SignInPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/user/account');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          router.push('/user/account');
        }
      } catch (error) {
        console.error('Error handling redirect result:', error);
      }
    };
    void handleRedirect();
  }, [router]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed', error);
    }
  };

  if (loading || user) {
    return <div>正在載入...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl mb-4">登入帳戶</h1>
        <Button onClick={handleSignIn}>使用 Google 登入</Button>
      </div>
    </div>
  );
}
