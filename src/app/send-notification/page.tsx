/**
 * 發送通知頁面
 *
 * 提供測試和發送系統通知的功能，包含：
 * - 通知類型選擇（資訊、成功、警告、錯誤）
 * - 通知分類選擇
 * - 即時通知發送
 * - 通知中心連結
 */

'use client';

import {
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import React, { useState, ReactElement } from 'react';

import { NotificationBell } from '@/app/notifications/components/NotificationBell';
import { useAuth } from '@/hooks/useAuth';
import { Timestamp } from '@/lib/firebase-client';
import { createNotification, createBulkNotifications } from '@/lib/firebase-notifications';
import type { NotificationMessage } from '@/types/notification';
import { getErrorMessage, logError, safeAsync, retry } from '@/utils/errorUtils';

// 通知類型選項
const NOTIFICATION_TYPES = [
  { value: 'info', label: '資訊', icon: InformationCircleIcon, color: 'text-blue-500' },
  { value: 'success', label: '成功', icon: CheckCircleIcon, color: 'text-green-500' },
  { value: 'warning', label: '警告', icon: ExclamationTriangleIcon, color: 'text-yellow-500' },
  { value: 'error', label: '錯誤', icon: XCircleIcon, color: 'text-red-500' },
] as const;

// 通知分類選項
const NOTIFICATION_CATEGORIES = [
  { value: 'project', label: '專案', icon: CogIcon },
  { value: 'schedule', label: '排程', icon: ClockIcon },
  { value: 'system', label: '系統', icon: CogIcon },
  { value: 'work', label: '工作', icon: UserGroupIcon },
  { value: 'emergency', label: '緊急', icon: ExclamationTriangleIcon },
] as const;

// 表單資料型別
interface NotificationFormData {
  title: string;
  message: string;
  type: NotificationMessage['type'];
  category: NotificationMessage['category'];
  priority: 'high' | 'normal' | 'low';
  actionUrl: string;
  expiresAt: string;
}

// 預設表單資料
const DEFAULT_FORM_DATA: NotificationFormData = {
  title: '',
  message: '',
  type: 'info',
  category: 'system',
  priority: 'normal',
  actionUrl: '',
  expiresAt: '',
};

export default function SendNotificationPage(): ReactElement {
  const { user } = useAuth();
  const [formData, setFormData] = useState<NotificationFormData>(DEFAULT_FORM_DATA);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // 處理表單變更
  const handleFormChange = (
    field: keyof NotificationFormData,
    value:
      | string
      | NotificationMessage['type']
      | NotificationMessage['category']
      | 'high'
      | 'normal'
      | 'low'
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // 發送通知
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || isSending) return;

    setIsSending(true);
    setSendStatus({ type: null, message: '' });

    await safeAsync(async () => {
      // 準備通知資料
      const notificationData = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        category: formData.category,
        priority: formData.priority,
        actionUrl: formData.actionUrl.trim() || undefined,
        expiresAt: formData.expiresAt ? Timestamp.fromDate(new Date(formData.expiresAt)) : undefined,
      };

      // 發送通知
      await retry(() => createNotification(user.uid, notificationData), 3, 1000);

      setSendStatus({
        type: 'success',
        message: '通知發送成功！',
      });

      // 重置表單
      setFormData(DEFAULT_FORM_DATA);

      // 3秒後清除狀態
      setTimeout(() => {
        setSendStatus({ type: null, message: '' });
      }, 3000);
    }, (error) => {
      setSendStatus({
        type: 'error',
        message: `發送通知失敗：${getErrorMessage(error)}`,
      });
      logError(error, { operation: 'send_notification', userId: user.uid });
    });
    setIsSending(false);
  };

  // 快速發送測試通知
  const sendTestNotification = async (type: NotificationMessage['type']) => {
    if (!user?.uid) {
      setSendStatus({
        type: 'error',
        message: '請先登入後再發送通知',
      });
      return;
    }

    setIsSending(true);
    setSendStatus({ type: null, message: '' });

    await safeAsync(async () => {
      const testMessages = {
        info: { title: '測試資訊通知', message: '這是一則測試資訊通知' },
        success: { title: '測試成功通知', message: '這是一則測試成功通知' },
        warning: { title: '測試警告通知', message: '這是一則測試警告通知' },
        error: { title: '測試錯誤通知', message: '這是一則測試錯誤通知' },
      };

      const testData = testMessages[type];

      await retry(() => createNotification(user.uid, {
        ...testData,
        type,
        category: 'system',
        priority: 'normal',
      }), 3, 1000);

      setSendStatus({
        type: 'success',
        message: `${testData.title}發送成功！`,
      });

      setTimeout(() => {
        setSendStatus({ type: null, message: '' });
      }, 3000);
    }, (error) => {
      setSendStatus({
        type: 'error',
        message: `發送測試通知失敗：${getErrorMessage(error)}`,
      });
      logError(error, { operation: 'send_test_notification', userId: user.uid, type });
    });
    setIsSending(false);
  };

  return (
    <main className='p-6 bg-white dark:bg-neutral-900 min-h-screen'>
      <div className='max-w-4xl mx-auto'>
        {/* 標題區域 */}
        <div className='flex items-center justify-between mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>發送通知</h1>
          <NotificationBell size='md' />
        </div>

        {/* 狀態訊息 */}
        {sendStatus.type && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              sendStatus.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}
          >
            <div className='flex items-center space-x-2'>
              {sendStatus.type === 'success' ? (
                <CheckCircleIcon className='h-5 w-5' />
              ) : (
                <XCircleIcon className='h-5 w-5' />
              )}
              <span>{sendStatus.message}</span>
            </div>
          </div>
        )}

        {/* 快速測試區域 */}
        <div className='mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl'>
          <h2 className='text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100'>快速測試</h2>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
            {NOTIFICATION_TYPES.map(({ value, label, icon: Icon, color }) => (
              <button
                key={value}
                onClick={() => sendTestNotification(value)}
                disabled={isSending}
                className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border transition-colors ${
                  isSending
                    ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700'
                    : 'hover:bg-white dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600'
                }`}
              >
                <Icon className={`h-5 w-5 ${color}`} />
                <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 發送表單 */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700'>
          <div className='p-6 border-b border-gray-200 dark:border-gray-700'>
            <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>發送自訂通知</h2>
          </div>

          <form onSubmit={handleSendNotification} className='p-6 space-y-6'>
            {/* 通知標題 */}
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                通知標題 *
              </label>
              <input
                type='text'
                value={formData.title}
                onChange={e => handleFormChange('title', e.target.value)}
                className='w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                placeholder='輸入通知標題'
                maxLength={100}
                required
              />
            </div>

            {/* 通知內容 */}
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                通知內容 *
              </label>
              <textarea
                value={formData.message}
                onChange={e => handleFormChange('message', e.target.value)}
                rows={4}
                className='w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none'
                placeholder='輸入通知內容'
                maxLength={500}
                required
              />
            </div>

            {/* 通知類型和分類 */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* 通知類型 */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  通知類型
                </label>
                <div className='grid grid-cols-2 gap-2'>
                  {NOTIFICATION_TYPES.map(({ value, label, icon: Icon, color }) => (
                    <label
                      key={value}
                      className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.type === value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <input
                        type='radio'
                        name='type'
                        value={value}
                        checked={formData.type === value}
                        onChange={e =>
                          handleFormChange('type', e.target.value as NotificationMessage['type'])
                        }
                        className='sr-only'
                      />
                      <Icon className={`h-5 w-5 ${color}`} />
                      <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 通知分類 */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  通知分類
                </label>
                <select
                  value={formData.category}
                  onChange={e =>
                    handleFormChange('category', e.target.value as NotificationMessage['category'])
                  }
                  className='w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                >
                  {NOTIFICATION_CATEGORIES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 優先級和過期時間 */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* 優先級 */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  優先級
                </label>
                <select
                  value={formData.priority}
                  onChange={e =>
                    handleFormChange('priority', e.target.value as 'high' | 'normal' | 'low')
                  }
                  className='w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                >
                  <option value='low'>低</option>
                  <option value='normal'>一般</option>
                  <option value='high'>高</option>
                </select>
              </div>

              {/* 過期時間 */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  過期時間（可選）
                </label>
                <input
                  type='datetime-local'
                  value={formData.expiresAt}
                  onChange={e => handleFormChange('expiresAt', e.target.value)}
                  className='w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                />
              </div>
            </div>

            {/* 動作連結 */}
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                動作連結（可選）
              </label>
              <input
                type='url'
                value={formData.actionUrl}
                onChange={e => handleFormChange('actionUrl', e.target.value)}
                className='w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                placeholder='https://example.com'
              />
            </div>

            {/* 發送按鈕 */}
            <div className='flex justify-end'>
              <button
                type='submit'
                disabled={isSending}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  isSending
                    ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700 text-gray-500'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSending ? (
                  <>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                    <span>發送中...</span>
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className='h-5 w-5' />
                    <span>發送通知</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 功能說明 */}
        <div className='mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl'>
          <h2 className='text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100'>功能說明</h2>
          <div className='text-sm text-blue-800 dark:text-blue-200 space-y-2'>
            <p>
              • <strong>通知類型：</strong>{' '}
              支援資訊、成功、警告、錯誤四種類型，每種類型都有不同的視覺樣式
            </p>
            <p>
              • <strong>通知分類：</strong> 專案、排程、系統、工作、緊急五種分類，便於管理和篩選
            </p>
            <p>
              • <strong>優先級：</strong> 高、一般、低三種優先級，影響通知的顯示順序
            </p>
            <p>
              • <strong>過期時間：</strong> 可設定通知的自動過期時間
            </p>
            <p>
              • <strong>動作連結：</strong> 點擊通知可跳轉到指定頁面
            </p>
            <p>
              • <strong>即時通知：</strong> 發送後會立即顯示在通知中心
            </p>
          </div>
        </div>

        {/* 相關連結 */}
        <div className='mt-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl'>
          <h2 className='text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100'>相關頁面</h2>
          <div className='space-y-2'>
            <a
              href='/notifications'
              className='block text-blue-600 dark:text-blue-400 hover:underline'
            >
              → 通知中心（查看所有通知）
            </a>
            <a href='/profile' className='block text-blue-600 dark:text-blue-400 hover:underline'>
              → 個人資料（管理通知偏好）
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
