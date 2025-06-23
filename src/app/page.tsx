"use client"; // 這是一個客戶端組件

import { useFirebase } from './modules/projects/components/firebase/FirebaseProvider'; // 導入您的 Firebase Context Hook
import { UserRole } from './modules/projects/types/roles'; // 導入角色定義
import { useRouter } from 'next/navigation'; // 導入 Next.js 導航鉤子
import { useEffect } from 'react';

export default function AuthenticationPage() {
  const { 
    currentUser, 
    currentRole, 
    userProfile,
    signInWithGoogle, 
    signOutUser, 
    loading, 
    isSigningIn 
  } = useFirebase();
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
      <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h1>您已登入</h1>
        
        {/* 基本用戶資訊 */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
          <h3>基本資訊</h3>
          <p>Email: {currentUser.email}</p>
          <p>UID: {currentUser.uid}</p>
          <p>您的角色: {currentRole}</p>
        </div>

        {/* Firestore 用戶資料 */}
        {userProfile && (
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '5px' }}>
            <h3>Firestore 用戶資料</h3>
            <p>顯示名稱: {userProfile.displayName}</p>
            <p>部門: {userProfile.department || '未設定'}</p>
            <p>職位: {userProfile.position || '未設定'}</p>
            <p>電話: {userProfile.phoneNumber || '未設定'}</p>
            <p>狀態: {userProfile.isActive ? '啟用' : '停用'}</p>
            <p>建立時間: {userProfile.createdAt?.toLocaleDateString()}</p>
            <p>最後更新: {userProfile.updatedAt?.toLocaleDateString()}</p>
            {userProfile.lastLoginAt && (
              <p>最後登入: {userProfile.lastLoginAt.toLocaleDateString()}</p>
            )}
          </div>
        )}

        <button
          onClick={signOutUser}
          style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          登出
        </button>

        {/* 導航按鈕 */}
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => router.push('/modules/projects/features/authentication')}
            style={{ 
              marginRight: '10px',
              padding: '10px 20px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer' 
            }}
          >
            用戶管理
          </button>
          <button
            onClick={() => router.push('/modules/projects/features/profile')}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer' 
            }}
          >
            個人資料
          </button>
        </div>

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
