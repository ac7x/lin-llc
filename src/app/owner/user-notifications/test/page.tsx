"use client";

import React from 'react';
import { NotificationTestTool } from '@/app/owner/notifications/components/NotificationTestTool';
import { NotificationBell, NotificationSummary } from '@/app/owner/notifications/components/NotificationBell';
import { useFirebase } from "@/hooks/useFirebase";

export default function NotificationTestPage() {
  const { user, loading } = useFirebase();

  if (loading) {
    return (
      <main className="p-6 bg-white dark:bg-neutral-900 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600 dark:text-gray-400">載入中...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 bg-white dark:bg-neutral-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">通知系統測試</h1>
          
          {/* 通知鈴鐺示例 */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">通知鈴鐺：</span>
              <NotificationBell size="sm" />
              <NotificationBell size="md" />
              <NotificationBell size="lg" />
            </div>
          </div>
        </div>

        {/* 用戶狀態 */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">用戶狀態</h2>
          {user ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>用戶 UID:</strong> {user.uid}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>顯示名稱:</strong> {user.displayName || '未設定'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Email:</strong> {user.email || '未設定'}
              </p>
              <NotificationSummary />
            </div>
          ) : (
            <p className="text-red-600 dark:text-red-400">用戶未登入，請先登入以測試通知功能</p>
          )}
        </div>

        {/* 功能說明 */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-100">功能說明</h2>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>• <strong>裝置識別：</strong> 自動記錄用戶的裝置資訊（瀏覽器、作業系統、裝置類型）</p>
            <p>• <strong>FCM Token：</strong> 用於推播通知的唯一識別碼</p>
            <p>• <strong>即時通知：</strong> 使用 Firestore 即時監聽，新通知會立即顯示</p>
            <p>• <strong>通知管理：</strong> 支援標記已讀、封存、批量操作等功能</p>
            <p>• <strong>通知類型：</strong> 支援資訊、成功、警告、錯誤四種類型</p>
            <p>• <strong>通知分類：</strong> 專案、排程、系統、工作、緊急五種分類</p>
          </div>
        </div>

        {/* 測試說明 */}
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-yellow-900 dark:text-yellow-100">測試步驟</h2>
          <ol className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-decimal list-inside">
            <li>確保已登入用戶帳號</li>
            <li>使用下方的測試工具建立通知</li>
            <li>前往 <a href="/owner/notifications" className="underline hover:no-underline">通知中心</a> 查看建立的通知</li>
            <li>測試標記已讀、封存等功能</li>
            <li>觀察上方通知鈴鐺的數字變化</li>
          </ol>
        </div>

        {/* 通知測試工具 */}
        <NotificationTestTool />

        {/* 相關連結 */}
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">相關頁面</h2>
          <div className="space-y-2">
            <a 
              href="/owner/notifications" 
              className="block text-blue-600 dark:text-blue-400 hover:underline"
            >
              → 通知中心（查看所有通知）
            </a>
            <a 
              href="/owner/settings" 
              className="block text-blue-600 dark:text-blue-400 hover:underline"
            >
              → 設定頁面（管理通知偏好）
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
