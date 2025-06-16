'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from './hooks/useAuth';
import { ROLE_NAMES } from '@/constants/roles';

export default function SignInPage() {
  const router = useRouter();
  const { user, userData, loading, error, signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      router.push('/');
    } catch (err) {
      // 錯誤已在 useAuth 中處理
      console.error('登入失敗:', err);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">載入中...</div>;
  }

  if (user && userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold">您已經登入</h1>
            <p className="mt-2 text-gray-600">歡迎回來，{userData.displayName}</p>
          </div>
          
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">您的角色：</h2>
            <div className="space-y-2">
              {Object.entries(userData.roles).map(([role, hasRole]) => (
                hasRole && (
                  <div key={role} className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>{ROLE_NAMES[role as keyof typeof ROLE_NAMES]}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">登入</h1>
          <p className="mt-2 text-gray-600">請選擇登入方式</p>
        </div>

        {error && (
          <div className="p-4 text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
            />
          </svg>
          使用 Google 登入
        </button>
      </div>
    </div>
  );
}
