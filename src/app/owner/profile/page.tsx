'use client'

import { useFirebase, signOut } from '@/hooks/useFirebase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useCallback } from 'react'

const UserPanelPage = () => {
  const { user, loading, auth } = useFirebase()
  const router = useRouter()

  const handleSignOut = useCallback(async () => {
    await signOut(auth)
    router.push('/shared/signin')
  }, [auth, router])

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
        <h1 className="text-2xl font-bold text-gray-900 mb-4 dark:text-gray-100">個人資料</h1>
        <div className="flex items-center space-x-4 mb-6">
          <Image
            src={user.photoURL || '/images/default-avatar.png'}
            alt="使用者頭像"
            className="h-16 w-16 rounded-full"
            width={64}
            height={64}
            priority
          />
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{user.displayName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">UID: {user.uid}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          登出
        </button>
      </div>
    </div>
  )
}

export default UserPanelPage
