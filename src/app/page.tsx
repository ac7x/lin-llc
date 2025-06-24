'use client';

import { useAuth } from '@/context/auth-provider';
import Link from 'next/link';

export default function HomePage() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>載入中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <div className="p-8 text-center bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">歡迎</h1>
        {user ? (
          <div>
            <p className="mb-4">你好, {user.displayName || user.email}</p>
            <button
              onClick={signOut}
              className="px-4 py-2 font-semibold text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              登出
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-4">你尚未登入。</p>
            <Link href="/signin">
              <button
                className="px-4 py-2 font-semibold text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                前往登入頁面
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
