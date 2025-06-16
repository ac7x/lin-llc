/**
 * 發送推播通知頁面
 * 
 * 提供發送系統推播通知的功能，包含：
 * - 通知類型選擇（資訊、成功、警告、錯誤）
 * - 通知分類選擇（專案、排程、系統、工作、緊急）
 * - 通知內容編輯（標題、訊息、圖片等）
 * - 推播設定（優先級、TTL、互動等）
 * - 目標用戶選擇（單一用戶、群組、全部）
 * - 發送狀態追蹤
 */

"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from '@/hooks/usePermissions';
import { NotificationBell } from '@/app/notifications/components/NotificationBell';
import { NOTIFICATION_TYPES, NOTIFICATION_CATEGORIES } from '../notifications/constants/notifications';
import { sendPushNotification } from '../notifications/lib/firebase-notifications';
import type { PushNotificationPayload } from '@/types/notification';
import { 
  BellIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface NotificationFormData {
  title: string;
  body: string;
  type: keyof typeof NOTIFICATION_TYPES;
  category: keyof typeof NOTIFICATION_CATEGORIES;
  priority: 'high' | 'normal' | 'low';
  ttl: number;
  requireInteraction: boolean;
  silent: boolean;
  vibrate: boolean;
  image?: string;
  clickAction?: string;
  data?: Record<string, unknown>;
}

const defaultFormData: NotificationFormData = {
  title: '',
  body: '',
  type: 'INFO',
  category: 'SYSTEM',
  priority: 'normal',
  ttl: 86400, // 24小時
  requireInteraction: true,
  silent: false,
  vibrate: true,
};

export default function SendNotificationPage() {
  const { user } = useAuth();
  const { permissions } = usePermissions(user?.uid);
  const [formData, setFormData] = useState<NotificationFormData>(defaultFormData);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // 檢查權限
  const hasPermission = permissions?.some(p => p.id === 'send_notifications');

  useEffect(() => {
    if (sendStatus) {
      const timer = setTimeout(() => {
        setSendStatus(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [sendStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !hasPermission) return;

    setIsSending(true);
    setSendStatus(null);

    try {
      const payload: PushNotificationPayload = {
        title: formData.title,
        body: formData.body,
        priority: formData.priority,
        ttl: formData.ttl,
        requireInteraction: formData.requireInteraction,
        silent: formData.silent,
        vibrate: formData.vibrate ? [200, 100, 200] : undefined,
        image: formData.image,
        clickAction: formData.clickAction,
        data: {
          ...formData.data,
          type: formData.type,
          category: formData.category,
        },
      };

      // 發送通知
      await sendPushNotification(user.uid, payload);

      setSendStatus({
        type: 'success',
        message: '通知已成功發送！',
      });

      // 重置表單
      setFormData(defaultFormData);
    } catch (error) {
      console.error('發送通知失敗:', error);
      setSendStatus({
        type: 'error',
        message: '發送通知失敗，請稍後再試。',
      });
    } finally {
      setIsSending(false);
    }
  };

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

  if (!hasPermission) {
    return (
      <main className="p-6 bg-white dark:bg-neutral-900 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              權限不足
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              您沒有發送通知的權限，請聯繫管理員。
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 bg-white dark:bg-neutral-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">發送推播通知</h1>
          <NotificationBell size="md" />
        </div>

        {/* 狀態訊息 */}
        {sendStatus && (
          <div className={`mb-6 p-4 rounded-lg ${
            sendStatus.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : sendStatus.type === 'error'
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
          }`}>
            <div className="flex items-center">
              {sendStatus.type === 'success' ? (
                <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
              ) : sendStatus.type === 'error' ? (
                <XCircleIcon className="w-5 h-5 text-red-500 mr-2" />
              ) : (
                <InformationCircleIcon className="w-5 h-5 text-blue-500 mr-2" />
              )}
              <p className={`text-sm ${
                sendStatus.type === 'success'
                  ? 'text-green-800 dark:text-green-200'
                  : sendStatus.type === 'error'
                  ? 'text-red-800 dark:text-red-200'
                  : 'text-blue-800 dark:text-blue-200'
              }`}>
                {sendStatus.message}
              </p>
            </div>
          </div>
        )}

        {/* 通知表單 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本資訊 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">基本資訊</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  標題
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="body" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  訊息內容
                </label>
                <textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    通知類型
                  </label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as NotificationFormData['type'] })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    {Object.entries(NOTIFICATION_TYPES).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    通知分類
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as NotificationFormData['category'] })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    {Object.entries(NOTIFICATION_CATEGORIES).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 推播設定 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">推播設定</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    優先級
                  </label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as NotificationFormData['priority'] })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="high">高</option>
                    <option value="normal">一般</option>
                    <option value="low">低</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="ttl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    有效期限（秒）
                  </label>
                  <input
                    type="number"
                    id="ttl"
                    value={formData.ttl}
                    onChange={(e) => setFormData({ ...formData, ttl: Number(e.target.value) })}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requireInteraction"
                    checked={formData.requireInteraction}
                    onChange={(e) => setFormData({ ...formData, requireInteraction: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requireInteraction" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    需要用戶互動
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="vibrate"
                    checked={formData.vibrate}
                    onChange={(e) => setFormData({ ...formData, vibrate: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="vibrate" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    震動提醒
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  圖片 URL（選填）
                </label>
                <input
                  type="url"
                  id="image"
                  value={formData.image || ''}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="clickAction" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  點擊動作 URL（選填）
                </label>
                <input
                  type="url"
                  id="clickAction"
                  value={formData.clickAction || ''}
                  onChange={(e) => setFormData({ ...formData, clickAction: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* 發送按鈕 */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSending}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  發送中...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                  發送通知
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
} 