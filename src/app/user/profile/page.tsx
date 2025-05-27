// src/app/user/profile/page.tsx
"use client";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, logout } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
    } catch (error) {
      alert('登出失敗');
    }
  };

  if (loading) return <div className="p-6 text-center">載入中...</div>;
  
  if (!user) return <div className="p-6 text-center">重定向中...</div>;

  return (
    <div className="p-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">個人資料</h1>
      
      <div className="bg-gray-100 p-4 rounded">
        <p><strong>姓名:</strong> {user.displayName}</p>
        <p><strong>電子郵件:</strong> {user.email}</p>
        {user.photoURL && (
          <img 
            src={user.photoURL} 
            alt="頭像" 
            className="w-16 h-16 rounded-full mt-2"
          />
        )}
      </div>

      <button
        className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
        onClick={handleLogout}
      >
        登出
      </button>
    </div>
  );
}