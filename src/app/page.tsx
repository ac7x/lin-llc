"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import firebaseClient, { User } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';

const USERS_COLLECTION = "users";

const HomePage: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [emailLogin, setEmailLogin] = useState({ email: '', password: '' });
  const [showEmailLogin, setShowEmailLogin] = useState(false);

  // 監聽認證狀態變化
  useEffect(() => {
    const unsubscribe = firebaseClient.onAuthStateChange((u) => {
      setUser(u);
      setLoading(false);
      if (u) router.push('/user/profile');
    });
    return () => unsubscribe();
  }, [router]);

  // Google 登入
  const handleGoogleLogin = async () => {
    setLoginLoading(true);
    try {
      const result = await firebaseClient.signInWithGoogle();
      if (result.success && result.user) {
        // 建立 Firestore 用戶資料
        await firebaseClient.setDocument(
          USERS_COLLECTION, 
          result.user.uid, 
          {
            email: result.user.email || '',
            displayName: result.user.displayName || '',
            photoURL: result.user.photoURL || '',
            createdAt: new Date()
          }
        );
      } else {
        alert(`登入失敗：${result.error}`);
      }
    } catch (error) {
      alert('登入失敗，請重試');
    } finally {
      setLoginLoading(false);
    }
  };

  // 電子郵件登入
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailLogin.email || !emailLogin.password) {
      alert('請輸入電子郵件和密碼');
      return;
    }
    setLoginLoading(true);
    try {
      const result = await firebaseClient.signInWithEmail(emailLogin.email, emailLogin.password);
      if (!result.success) {
        alert(`登入失敗：${result.error}`);
      }
    } catch (error) {
      alert('登入失敗，請重試');
    } finally {
      setLoginLoading(false);
    }
  };

  // 註冊新帳號並建立用戶資料
  const handleEmailSignUp = async () => {
    if (!emailLogin.email || !emailLogin.password) {
      alert('請輸入電子郵件和密碼');
      return;
    }
    if (emailLogin.password.length < 6) {
      alert('密碼至少需要 6 個字符');
      return;
    }
    setLoginLoading(true);
    try {
      const result = await firebaseClient.signUpWithEmail(emailLogin.email, emailLogin.password);
      if (result.success && result.user) {
        // 註冊後建立 Firestore 用戶資料
        await firebaseClient.setDocument(
          USERS_COLLECTION,
          result.user.uid,
          {
            email: result.user.email || '',
            displayName: result.user.displayName || '',
            photoURL: result.user.photoURL || '',
            createdAt: new Date()
          }
        );
        alert('註冊成功！');
      } else {
        alert(`註冊失敗：${result.error}`);
      }
    } catch (error) {
      alert('註冊失敗，請重試');
    } finally {
      setLoginLoading(false);
    }
  };

  // 忘記密碼
  const handleForgotPassword = async () => {
    if (!emailLogin.email) {
      alert('請先輸入您的電子郵件地址');
      return;
    }
    try {
      const result = await firebaseClient.sendPasswordReset(emailLogin.email);
      if (result.success) {
        alert('密碼重置郵件已發送，請檢查您的信箱');
      } else {
        alert(`發送失敗：${result.error}`);
      }
    } catch (error) {
      alert('發送失敗，請重試');
    }
  };

  // 輸入變化處理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmailLogin(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">載入中...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center">登入或註冊</h1>
      {/* Google 登入按鈕 */}
      <button
        className={`w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 ${
          loginLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={handleGoogleLogin}
        disabled={loginLoading}
        type="button"
      >
        {loginLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>使用 Google 帳號登入</span>
          </>
        )}
      </button>

      {/* 分隔線 */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">或</span>
        </div>
      </div>

      {/* 電子郵件登入切換按鈕 */}
      <button
        className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        onClick={() => setShowEmailLogin(!showEmailLogin)}
        type="button"
      >
        {showEmailLogin ? '隱藏' : '使用'} 電子郵件登入
      </button>

      {/* 電子郵件登入表單 */}
      {showEmailLogin && (
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                電子郵件
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={emailLogin.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="請輸入您的電子郵件"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密碼
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={emailLogin.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="請輸入您的密碼"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <button
                type="submit"
                disabled={loginLoading}
                className={`w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors ${
                  loginLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loginLoading ? '登入中...' : '登入'}
              </button>
              <button
                type="button"
                onClick={handleEmailSignUp}
                disabled={loginLoading}
                className={`w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors ${
                  loginLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loginLoading ? '註冊中...' : '註冊新帳號'}
              </button>
            </div>
          </form>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="w-full text-sm text-blue-600 hover:text-blue-800 underline"
          >
            忘記密碼？
          </button>
        </div>
      )}

      <p className="text-xs text-gray-500 text-center">
        登入即表示您同意我們的服務條款和隱私政策
      </p>
    </div>
  );
};

export default HomePage;