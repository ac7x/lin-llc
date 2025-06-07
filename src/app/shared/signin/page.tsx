"use client";

import React, { useState, useEffect } from 'react';
import { 
  auth, 
  GoogleAuthProvider, 
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  getRedirectResult
} from '@/lib/firebase/firebase-client';
import { useFirebase } from '@/lib/firebase/firebase-context';
import { getAppCheckToken } from '@/lib/firebase/firebase-appcheck';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase-client';
import { serverTimestamp } from "firebase/firestore";

// 類型定義
interface SignInFormData {
  email: string;
  password: string;
  confirmPassword?: string; // 註冊時需要
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

type AuthMode = 'signin' | 'signup';

export default function SignInPage(): React.JSX.Element {
  const router = useRouter();
  const { user, appCheckReady, appCheckLog, retryAppCheck } = useFirebase();
  
  // 狀態管理
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: false,
    error: null
  });
  
  const [formData, setFormData] = useState<SignInFormData>({
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // 除錯日誌函數
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setDebugLogs(prev => [...prev, logEntry]);
    console.log(logEntry);
  };

  // 監聽認證狀態變化
  useEffect(() => {
    if (user) {
      addDebugLog(`✅ 用戶已登入: ${user.email || user.displayName || 'Unknown'}`);
      // 登入成功後導向到主頁面
      router.push('/owner/dashboard');
    }
  }, [user, router]);

  // 檢查重定向結果 (Google 登入回調)
  useEffect(() => {
    const checkRedirectResult = async () => {
      if (!appCheckReady) return;
      
      try {
        addDebugLog('🔍 檢查 Google 登入重定向結果...');
        const result = await getRedirectResult(auth);
        
        if (result?.user) {
          addDebugLog(`✅ Google 登入成功: ${result.user.email}`);
          // Firebase context 會自動處理用戶狀態更新
        } else {
          addDebugLog('ℹ️ 無重定向結果 (正常情況)');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        addDebugLog(`❌ 檢查重定向結果失敗: ${errorMsg}`);
        setAuthState(prev => ({ ...prev, error: `重定向登入失敗: ${errorMsg}` }));
      }
    };

    checkRedirectResult();
  }, [appCheckReady]);

  // 設置持久性登入
  const setupPersistence = async (): Promise<boolean> => {
    try {
      addDebugLog('🔧 設置瀏覽器持久性登入...');
      await setPersistence(auth, browserLocalPersistence);
      addDebugLog('✅ 持久性登入設置成功');
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addDebugLog(`❌ 設置持久性登入失敗: ${errorMsg}`);
      setAuthState(prev => ({ ...prev, error: `持久性設置失敗: ${errorMsg}` }));
      return false;
    }
  };

  // 等待 App Check 初始化
  const waitForAppCheck = async (): Promise<boolean> => {
    if (appCheckReady) {
      addDebugLog('✅ App Check 已就緒');
      return true;
    }

    addDebugLog('⏳ 等待 App Check 初始化...');
    
    // 等待最多 10 秒
    const maxWait = 10000;
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      if (appCheckReady) {
        addDebugLog('✅ App Check 初始化完成');
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    addDebugLog('❌ App Check 初始化超時');
    return false;
  };

  // Google 登入
  const handleGoogleSignIn = async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    addDebugLog('🚀 開始 Google 登入流程...');

    try {
      // 1. 等待 App Check
      const appCheckOk = await waitForAppCheck();
      if (!appCheckOk) {
        throw new Error('App Check 未初始化，無法進行登入');
      }

      // 2. 設置持久性
      const persistenceOk = await setupPersistence();
      if (!persistenceOk) {
        throw new Error('無法設置登入持久性');
      }

      // 3. 檢查 App Check token
      const token = await getAppCheckToken();
      if (token) {
        addDebugLog('🔐 App Check token 已取得');
      } else {
        addDebugLog('⚠️ 無法取得 App Check token，但繼續進行登入');
      }

      // 4. 創建 Google 認證提供者
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      addDebugLog('📧 Google 認證提供者已設置');

      // 5. 執行重定向登入
      addDebugLog('🔄 執行 Google 重定向登入...');
      await signInWithRedirect(auth, provider);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addDebugLog(`❌ Google 登入失敗: ${errorMsg}`);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: `Google 登入失敗: ${errorMsg}` 
      }));
    }
  };

  // 電子郵件/密碼登入
  const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setAuthState(prev => ({ ...prev, error: '請輸入電子郵件和密碼' }));
      return;
    }

    // 註冊模式下檢查密碼確認
    if (authMode === 'signup') {
      if (!formData.confirmPassword) {
        setAuthState(prev => ({ ...prev, error: '請確認密碼' }));
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setAuthState(prev => ({ ...prev, error: '密碼與確認密碼不符' }));
        return;
      }
      if (formData.password.length < 6) {
        setAuthState(prev => ({ ...prev, error: '密碼至少需要 6 個字元' }));
        return;
      }
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    const actionText = authMode === 'signin' ? '登入' : '註冊';
    addDebugLog(`🚀 開始電子郵件${actionText}: ${formData.email}`);

    try {
      // 1. 等待 App Check
      const appCheckOk = await waitForAppCheck();
      if (!appCheckOk) {
        throw new Error('App Check 未初始化，無法進行登入');
      }

      // 2. 設置持久性
      const persistenceOk = await setupPersistence();
      if (!persistenceOk) {
        throw new Error('無法設置登入持久性');
      }

      // 3. 檢查 App Check token
      const token = await getAppCheckToken();
      if (token) {
        addDebugLog('🔐 App Check token 已取得');
      } else {
        addDebugLog('⚠️ 無法取得 App Check token，但繼續進行登入');
      }

      // 4. 執行認證
      let userCredential;
      if (authMode === 'signin') {
        addDebugLog('🔑 執行電子郵件/密碼登入...');
        userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        addDebugLog(`✅ 電子郵件登入成功: ${userCredential.user.email}`);
      } else {
        addDebugLog('📝 執行電子郵件/密碼註冊...');
        userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        addDebugLog(`✅ 電子郵件註冊成功: ${userCredential.user.email}`);

        // 儲存使用者資訊到 Firestore
        if (userCredential.user) {
          const { uid, displayName, email, photoURL } = userCredential.user;
          const userRef = doc(db, "users", uid);
          const snap = await getDoc(userRef);
          await setDoc(
            userRef,
            snap.exists()
              ? { displayName, email, photoURL }
              : { uid, displayName, email, photoURL, role: "user", emailVerified: false, updatedAt: serverTimestamp(), disabled: false, metadata: { creationTime: new Date().toISOString(), lastSignInTime: "" } },
            { merge: true }
          );
        }
      }
      
      setAuthState(prev => ({ ...prev, loading: false }));
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addDebugLog(`❌ 電子郵件${actionText}失敗: ${errorMsg}`);
      
      // 提供更友善的錯誤訊息
      let friendlyError = `電子郵件${actionText}失敗: ${errorMsg}`;
      if (errorMsg.includes('email-already-in-use')) {
        friendlyError = '此電子郵件已被註冊，請使用其他電子郵件或嘗試登入';
      } else if (errorMsg.includes('user-not-found')) {
        friendlyError = '此電子郵件尚未註冊，請先註冊或檢查電子郵件是否正確';
      } else if (errorMsg.includes('wrong-password')) {
        friendlyError = '密碼錯誤，請檢查您的密碼';
      } else if (errorMsg.includes('invalid-email')) {
        friendlyError = '電子郵件格式不正確';
      } else if (errorMsg.includes('weak-password')) {
        friendlyError = '密碼強度不足，請使用至少 6 個字元';
      }
      
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: friendlyError
      }));
    }
  };

  // 表單輸入處理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // 清除錯誤訊息
    if (authState.error) {
      setAuthState(prev => ({ ...prev, error: null }));
    }
  };

  // 切換登入/註冊模式
  const toggleAuthMode = () => {
    setAuthMode(prev => prev === 'signin' ? 'signup' : 'signin');
    setAuthState(prev => ({ ...prev, error: null }));
    setFormData({
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* 主要登入卡片 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* 標頭 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {authMode === 'signin' ? '歡迎回來' : '建立帳號'}
            </h1>
            <p className="text-gray-600">
              {authMode === 'signin' ? '請選擇登入方式' : '請填寫資訊以建立新帳號'}
            </p>
          </div>

          {/* App Check 狀態指示器 */}
          <div className="mb-6 p-3 rounded-lg bg-gray-50 border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">安全驗證狀態</span>
              <div className="flex items-center space-x-2">
                {appCheckReady ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">已就緒</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-yellow-600">初始化中...</span>
                  </>
                )}
              </div>
            </div>
            {!appCheckReady && retryAppCheck && (
              <button
                onClick={retryAppCheck}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700 underline"
              >
                重試安全驗證
              </button>
            )}
          </div>

          {/* Google 登入按鈕 */}
          <button
            onClick={handleGoogleSignIn}
            disabled={authState.loading || !appCheckReady}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {authState.loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                使用 Google 帳號{authMode === 'signin' ? '登入' : '註冊'}
              </>
            )}
          </button>

          {/* 分隔線 */}
          <div className="my-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">或</span>
              </div>
            </div>
          </div>

          {/* 電子郵件/密碼登入表單 */}
          <form onSubmit={handleEmailPasswordSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                電子郵件
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="請輸入您的電子郵件"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密碼
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={authMode === 'signin' ? "current-password" : "new-password"}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={authMode === 'signin' ? "請輸入您的密碼" : "請設定密碼 (至少 6 個字元)"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878l-1.414 1.414m4.242 4.242l1.414 1.414M14.12 14.12L15.536 15.536m-4.242-4.242l1.414-1.414" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* 註冊模式下顯示確認密碼欄位 */}
            {authMode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  確認密碼
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="請再次輸入密碼"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878l-1.414 1.414m4.242 4.242l1.414 1.414M14.12 14.12L15.536 15.536m-4.242-4.242l1.414-1.414" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={authState.loading || !appCheckReady}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {authState.loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                authMode === 'signin' ? '登入' : '註冊'
              )}
            </button>
          </form>

          {/* 模式切換連結 */}
          <div className="mt-4 text-center">
            <button
              onClick={toggleAuthMode}
              disabled={authState.loading}
              className="text-sm text-indigo-600 hover:text-indigo-700 underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {authMode === 'signin' ? '還沒有帳號？立即註冊' : '已有帳號？回到登入'}
            </button>
          </div>

          {/* 錯誤訊息 */}
          {authState.error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex">
                <svg className="flex-shrink-0 h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{authState.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 除錯面板切換按鈕 */}
        <div className="text-center">
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            {showDebugPanel ? '隱藏' : '顯示'}除錯資訊
          </button>
        </div>

        {/* 除錯面板 */}
        {showDebugPanel && (
          <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
            {/* App Check 日誌 */}
            {appCheckLog && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">App Check 日誌</h3>
                <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">{appCheckLog}</pre>
                </div>
              </div>
            )}

            {/* 認證除錯日誌 */}
            {debugLogs.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">認證日誌</h3>
                <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {debugLogs.map((log, index) => (
                    <div key={index} className="text-xs text-gray-700 mb-1">
                      {log}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setDebugLogs([])}
                  className="mt-2 text-xs text-red-600 hover:text-red-700 underline"
                >
                  清除日誌
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}