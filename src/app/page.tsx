"use client"; // 這是一個客戶端組件

import { useFirebase } from './modules/projects/components/firebase/FirebaseProvider'; // 導入您的 Firebase Context Hook
import { UserRole } from './modules/projects/types/roles'; // 導入角色定義
import { useRouter } from 'next/navigation'; // 導入 Next.js 導航鉤子
import { useEffect } from 'react';

export default function AuthenticationPage() {
  const { currentUser, currentRole, signInWithGoogle, signOutUser, loading, isSigningIn } = useFirebase();
  const router = useRouter();

  // 可選：如果使用者已經登入，可以將他們重定向到主頁或其他地方
  useEffect(() => {
    if (!loading && currentUser && currentRole !== UserRole.GUEST) {
      console.log("User already logged in, redirecting to home.");
      // router.push('/'); // 例如，導向到主頁
    }
  }, [loading, currentUser, currentRole, router]);

  if (loading) {
    return <div>Loading authentication status...</div>;
  }

  // 如果使用者已登入
  if (currentUser) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h1>您已登入</h1>
        <p>Email: {currentUser.email}</p>
        <p>UID: {currentUser.uid}</p>
        <p>您的角色: {currentRole}</p>
        <button
          onClick={signOutUser}
          style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          登出
        </button>

        {/* 範例：根據權限顯示不同內容 */}
        {currentRole === UserRole.ADMIN && (
          <p style={{ marginTop: '20px', color: 'green' }}>您是管理員，可以看到所有功能！</p>
        )}
        {currentRole === UserRole.MANAGER && (
          <p style={{ marginTop: '20px', color: 'blue' }}>您是經理，可以查看報告！</p>
        )}
        {currentRole === UserRole.GUEST && (
          <p style={{ marginTop: '20px', color: 'red' }}>您是訪客，權限受限！</p>
        )}

      </div>
    );
  }

  // 如果使用者未登入
  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto', border: '1px solid #ccc', borderRadius: '8px', textAlign: 'center' }}>
      <h1>登入</h1>
      <p>請使用 Google 帳號登入以繼續。</p>
      <button
        onClick={async () => {
          const tokens = await signInWithGoogle();
          if (tokens) {
            // 登入成功，可選導向到其他頁面
            // router.push('/dashboard');
            console.log("Google Sign-In successful on page.");
          }
        }}
        disabled={isSigningIn}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: isSigningIn ? '#6c757d' : '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px', 
          cursor: isSigningIn ? 'not-allowed' : 'pointer',
          opacity: isSigningIn ? 0.6 : 1
        }}
      >
        {isSigningIn ? '登入中...' : '使用 Google 登入'}
      </button>
      {isSigningIn && (
        <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          正在開啟 Google 登入視窗，請稍候...
        </p>
      )}
      {/* 這裡可以添加其他登入方式或註冊選項 */}
    </div>
  );
}
