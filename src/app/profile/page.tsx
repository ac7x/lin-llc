/**
 * 用戶個人資料頁面
 * 
 * 提供用戶個人資料管理功能，包含：
 * - 個人資訊編輯
 * - 帳號設定
 * - 通知偏好設定
 * - 權限查看
 * - 活動記錄
 */

'use client'

import { useAuth } from '@/app/signin/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useCallback } from 'react'
import { signOut, auth } from '@/lib/firebase-client'

const roleDisplayNames: Record<string, string> = {
  owner: '擁有者',
  admin: '管理員',
  finance: '財務',
  user: '一般用戶',
  helper: '助手',
  temporary: '臨時用戶',
  coord: '協調員',
  safety: '安全員',
  foreman: '工頭',
  vendor: '供應商'
} as const;

const UserPanelPage = () => {
  const { user, loading } = useAuth()
  const router = useRouter()

  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('登出失敗:', error)
    }
  }, [router])

  return (
    <main className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">個人資料</h1>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : user ? (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <div className="flex items-center space-x-6">
                <div className="relative group">
                  <Image
                    src={user.photoURL || '/images/default-avatar.png'}
                    alt="使用者頭像"
                    className="h-24 w-24 rounded-full ring-4 ring-blue-100 dark:ring-blue-900 transition-all duration-300 group-hover:ring-blue-300 dark:group-hover:ring-blue-700 group-hover:scale-105"
                    width={96}
                    height={96}
                    priority
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{user.displayName}</p>
                  <p className="text-gray-600 dark:text-gray-300">{user.email}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">UID: {user.uid}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 dark:from-blue-900 dark:to-blue-800 dark:text-blue-200"
                    >
                      {roleDisplayNames[user.currentRole || 'user'] || '一般用戶'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">帳號設定</h2>
              <div className="space-y-4">
                <button
                  onClick={handleSignOut}
                  className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:-translate-y-0.5 font-medium shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  登出
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <div className="flex flex-col items-center">
              <svg className="w-12 h-12 mb-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              請先登入
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default UserPanelPage
