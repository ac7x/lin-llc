/**
 * 發送通知頁面
 * 
 * 提供測試和發送系統通知的功能，包含：
 * - 通知測試工具
 * - 通知類型選擇（資訊、成功、警告、錯誤）
 * - 通知分類選擇
 * - 即時通知發送
 * - 通知中心連結
 */

"use client";

import React from 'react';
import { NotificationTestTool } from '@/app/notifications/components/NotificationTestTool';
import { NotificationBell } from '@/app/notifications/components/NotificationBell';
import { useAuth } from "@/hooks/useAuth";

export default function SendNotificationPage() {
  const { user } = useAuth();

  if (!user) {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">發送通知</h1>
          <NotificationBell size="md" />
        </div>

        {/* 用戶狀態 */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">用戶狀態</h2>
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>用戶 UID:</strong> {user.uid}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>顯示名稱:</strong> {user.displayName || '未設定'}
            </p>
          </div>
        </div>

        {/* 功能說明 */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-100">通知功能說明</h2>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>• <strong>通知類型：</strong> 支援資訊、成功、警告、錯誤四種類型</p>
            <p>• <strong>通知分類：</strong> 專案、排程、系統、工作、緊急五種分類</p>
            <p>• <strong>即時通知：</strong> 發送後會立即顯示在通知中心</p>
          </div>
        </div>

        {/* 通知發送工具 */}
        <NotificationTestTool />

        {/* 相關連結 */}
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">相關頁面</h2>
          <div className="space-y-2">
            <a 
              href="/notifications" 
              className="block text-blue-600 dark:text-blue-400 hover:underline"
            >
              → 通知中心（查看所有通知）
            </a>
            <a 
              href="/settings" 
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