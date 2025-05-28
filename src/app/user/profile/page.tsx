// src/app/user/profile/page.tsx
"use client";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, logout } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';

export default function ProfilePage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch {
      alert('登出失敗');
    }
  };

  if (loading) return <div className="p-6 text-center">載入中...</div>;
  
  if (!user) return <div className="p-6 text-center">重定向中...</div>;

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen flex items-center justify-center">
      <div className="p-8 max-w-md w-full mx-auto bg-white dark:bg-neutral-900 shadow-xl rounded-xl flex flex-col items-center space-y-6">
        <h1 className="text-3xl font-extrabold text-center mb-2 tracking-tight">個人資料</h1>
        {user.photoURL && (
          <div className="flex justify-center w-full">
            <Image
              src={user.photoURL}
              alt="頭像"
              width={96}
              height={96}
              className="rounded-full border-4 border-white dark:border-neutral-800 shadow-lg"
            />
          </div>
        )}
        <div className="w-full flex flex-col items-center space-y-2 border-t border-b border-gray-200 dark:border-neutral-700 py-4">
          <div className="text-lg font-semibold">{user.displayName || '—'}</div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">{user.email || '—'}</div>
        </div>
        <button
          className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold text-lg mt-2"
          onClick={handleLogout}
        >
          登出
        </button>
      </div>
    </div>
  );
}