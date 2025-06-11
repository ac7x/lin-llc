'use client'

import { useFirebase } from '@/hooks/useFirebase'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function UserPage() {
  const { user, loading } = useFirebase()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/shared/signin')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center dark:bg-gray-900">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">載入中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 dark:shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 dark:text-gray-100">歡迎回來</h1>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <img
              src={user.photoURL || '/images/default-avatar.png'}
              alt="使用者頭像"
              className="h-12 w-12 rounded-full"
            />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">{user.displayName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            這是您的個人儀表板。您可以在這裡查看您的專案進度、待辦事項和最新通知。
          </p>
        </div>
      </div>
    </div>
  )
}