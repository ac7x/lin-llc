// src/app/page.tsx
"use client";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, signInWithGooglePopup, signInWithGoogleRedirect } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
};

export default function HomePage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/user/profile');
    }
  }, [user, router]);

  const handleGoogleLogin = async () => {
    try {
      if (isMobile()) {
        await signInWithGoogleRedirect();
      } else {
        await signInWithGooglePopup();
      }
    } catch {
      alert('登入失敗');
    }
  };

  if (loading) return <div className="p-6 text-center">載入中...</div>;
  
  if (user) return <div className="p-6 text-center">重定向中...</div>;

  return (
    <div className="p-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Google 帳號登入</h1>
      <button
        className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
        onClick={handleGoogleLogin}
      >
        使用 Google 帳號登入
      </button>
    </div>
  );
}