'use client'

import { useFirebase, signOut } from '@/hooks/useFirebase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useCallback } from 'react'
import { useUserRole } from '@/hooks/useUserRole'

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
  const { user, loading, auth } = useFirebase()
  const { userRole, loading: roleLoading } = useUserRole()
  const router = useRouter()

  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth)
      router.push('/shared/signin')
    } catch (error) {
      console.error('登出失敗:', error)
    }
  }, [auth, router])

  if (loading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">載入中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 dark:bg-gray-800 transform transition-all duration-300 hover:shadow-2xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 dark:text-gray-100 border-b pb-4">個人資料</h1>
          
          <div className="flex items-center space-x-6 mb-8">
            <div className="relative">
              <Image
                src={user.photoURL || '/images/default-avatar.png'}
                alt="使用者頭像"
                className="h-24 w-24 rounded-full ring-4 ring-blue-100 dark:ring-blue-900 transition-transform duration-300 hover:scale-105"
                width={96}
                height={96}
                priority
              />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{user.displayName}</p>
              <p className="text-gray-600 dark:text-gray-300">{user.email}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">UID: {user.uid}</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {roleDisplayNames[userRole || 'user'] || '一般用戶'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleSignOut}
              className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:-translate-y-0.5 font-medium shadow-lg hover:shadow-xl"
            >
              登出
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserPanelPage
