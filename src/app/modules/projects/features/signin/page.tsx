/**
 * 登入頁面
 * 
 * 提供用戶登入功能，包含：
 * - Google 登入
 * - 錯誤處理
 * - 登入狀態管理
 */

'use client';

import { useAuth } from '@/hooks/useAuth';
import { useProjectSignin } from '../../hooks/useProjectSignin';
import { LoadingSpinner, PageContainer, PageHeader } from '../../components/common';
import { projectStyles } from '../../styles';

export default function SignInPage() {
  const { user, loading: authLoading } = useAuth();
  const { loading: signinLoading, error, signInWithGoogle, clearError } = useProjectSignin();

  const handleGoogleSignIn = async () => {
    clearError();
    await signInWithGoogle('/modules');
  };

  if (authLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center min-h-64">
          <LoadingSpinner size="large" />
        </div>
      </PageContainer>
    );
  }

  if (user) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            您已經登入
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            歡迎回來，{user.displayName}！
          </p>
          <button
            onClick={() => window.location.href = '/modules'}
            className={projectStyles.button.primary}
          >
            前往專案模組
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="登入" 
        subtitle="請選擇登入方式以繼續使用專案管理系統"
      />

      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              歡迎使用專案管理系統
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              請選擇登入方式以繼續
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex">
                <svg
                  className="w-5 h-5 text-red-400 mr-2 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-red-800 dark:text-red-200 text-sm">
                  {error}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={signinLoading}
              className={`
                w-full flex items-center justify-center px-6 py-3 
                border border-transparent rounded-lg shadow-sm 
                text-sm font-medium text-white 
                bg-blue-600 hover:bg-blue-700 focus:bg-blue-700
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                dark:focus:ring-offset-gray-800
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 transform hover:scale-105
              `}
            >
              {signinLoading ? (
                <LoadingSpinner size="small" />
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                    />
                  </svg>
                  使用 Google 登入
                </>
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  或
                </span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                登入即表示您同意我們的
              </p>
              <div className="mt-1 space-x-2">
                <a
                  href="#"
                  className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  服務條款
                </a>
                <span className="text-gray-500 dark:text-gray-400">和</span>
                <a
                  href="#"
                  className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  隱私政策
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                系統特色
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  專案管理
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  時程追蹤
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  費用管理
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  AI 助手
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            需要協助？請聯繫系統管理員
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
