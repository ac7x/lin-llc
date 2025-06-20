'use client';

import React, { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { parseToDate } from '@/utils/dateUtils';
import {
  BellIcon,
  CheckIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon, CheckIcon as CheckSolidIcon } from '@heroicons/react/24/solid';
import type { NotificationMessage } from '@/types/notification';

// 通知類型圖標映射
const getNotificationIcon = (type: NotificationMessage['type']) => {
  const iconClass = 'h-6 w-6';

  switch (type) {
    case 'error':
      return <XCircleIcon className={`${iconClass} text-red-500`} />;
    case 'warning':
      return <ExclamationTriangleIcon className={`${iconClass} text-yellow-500`} />;
    case 'success':
      return <CheckCircleIcon className={`${iconClass} text-green-500`} />;
    case 'info':
    default:
      return <InformationCircleIcon className={`${iconClass} text-blue-500`} />;
  }
};

// 通知類型中文映射
const getCategoryText = (category: NotificationMessage['category']): string => {
  const categoryMap = {
    project: '專案',
    schedule: '排程',
    system: '系統',
    work: '工作',
    emergency: '緊急',
  };
  return categoryMap[category] || category;
};

interface NotificationItemProps {
  notification: NotificationMessage;
  onMarkAsRead: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
}

function NotificationItem({ notification, onMarkAsRead, onArchive }: NotificationItemProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMarkAsRead = async () => {
    if (notification.isRead || isProcessing) return;

    setIsProcessing(true);
    try {
      await onMarkAsRead(notification.id);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchive = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      await onArchive(notification.id);
    } catch (error) {
      console.error('Failed to archive:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClick = () => {
    if (!notification.isRead) {
      handleMarkAsRead();
    }

    // 如果有動作 URL，則導航到該頁面
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <div
      className={`
        bg-white dark:bg-neutral-800 shadow-sm rounded-xl p-4 border 
        ${
          notification.isRead
            ? 'border-gray-200 dark:border-neutral-700'
            : 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
        }
        ${notification.actionUrl ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700' : ''}
        transition-colors duration-200
      `}
      onClick={handleClick}
    >
      <div className='flex items-start justify-between'>
        <div className='flex items-start space-x-3 flex-1'>
          {/* 通知圖標 */}
          <div className='flex-shrink-0 mt-1'>{getNotificationIcon(notification.type)}</div>

          {/* 通知內容 */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-center space-x-2 mb-1'>
              <h3
                className={`text-sm font-semibold ${notification.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'}`}
              >
                {notification.title}
              </h3>
              <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'>
                {getCategoryText(notification.category)}
              </span>
              {!notification.isRead && (
                <div className='w-2 h-2 bg-blue-500 rounded-full flex-shrink-0'></div>
              )}
            </div>

            <p
              className={`text-sm ${notification.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'} mb-2`}
            >
              {notification.message}
            </p>

            <div className='flex items-center justify-between'>
              <span className='text-xs text-gray-500 dark:text-gray-500'>
                {formatDistanceToNow(parseToDate(notification.createdAt), {
                  addSuffix: true,
                  locale: zhTW,
                })}
              </span>

              {notification.readAt && (
                <span className='text-xs text-gray-400 dark:text-gray-500'>
                  已讀於{' '}
                  {formatDistanceToNow(parseToDate(notification.readAt), {
                    addSuffix: true,
                    locale: zhTW,
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className='flex items-center space-x-2 ml-4'>
          {!notification.isRead && (
            <button
              onClick={e => {
                e.stopPropagation();
                handleMarkAsRead();
              }}
              disabled={isProcessing}
              className='p-1 text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-50'
              title='標記為已讀'
            >
              {isProcessing ? (
                <div className='w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
              ) : (
                <CheckIcon className='h-4 w-4' />
              )}
            </button>
          )}

          <button
            onClick={e => {
              e.stopPropagation();
              handleArchive();
            }}
            disabled={isProcessing}
            className='p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50'
            title='封存'
          >
            <ArchiveBoxIcon className='h-4 w-4' />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    refreshNotifications,
  } = useNotifications({
    includeArchived: showArchived,
    onlyUnread: showOnlyUnread,
    realtime: true,
  });

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  if (loading) {
    return (
      <main className='p-6 bg-white dark:bg-neutral-900 min-h-screen'>
        <div className='flex items-center justify-center h-64'>
          <div className='flex items-center space-x-2'>
            <div className='w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
            <span className='text-gray-600 dark:text-gray-400'>載入通知中...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className='p-6 bg-white dark:bg-neutral-900 min-h-screen'>
      {/* 標題與操作區 */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center space-x-3'>
          <BellSolidIcon className='h-8 w-8 text-blue-500' />
          <div>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>通知中心</h1>
            {unreadCount > 0 && (
              <p className='text-sm text-gray-600 dark:text-gray-400'>{unreadCount} 則未讀通知</p>
            )}
          </div>
        </div>

        <div className='flex items-center space-x-3'>
          <button
            onClick={refreshNotifications}
            className='px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors'
          >
            重新整理
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className='flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
            >
              <CheckSolidIcon className='h-4 w-4' />
              <span>全部標記為已讀</span>
            </button>
          )}
        </div>
      </div>

      {/* 篩選選項 */}
      <div className='flex items-center space-x-4 mb-6'>
        <label className='flex items-center space-x-2'>
          <input
            type='checkbox'
            checked={showOnlyUnread}
            onChange={e => setShowOnlyUnread(e.target.checked)}
            className='rounded'
          />
          <span className='text-sm text-gray-700 dark:text-gray-300'>只顯示未讀</span>
        </label>

        <label className='flex items-center space-x-2'>
          <input
            type='checkbox'
            checked={showArchived}
            onChange={e => setShowArchived(e.target.checked)}
            className='rounded'
          />
          <span className='text-sm text-gray-700 dark:text-gray-300'>包含已封存</span>
        </label>
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className='mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
          <p className='text-red-800 dark:text-red-200'>{error}</p>
        </div>
      )}

      {/* 通知列表 */}
      <div className='space-y-3'>
        {notifications.length === 0 ? (
          <div className='text-center py-12'>
            <BellIcon className='mx-auto h-12 w-12 text-gray-400 mb-4' />
            <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>沒有通知</h3>
            <p className='text-gray-600 dark:text-gray-400'>
              {showOnlyUnread ? '目前沒有未讀通知' : '目前沒有任何通知'}
            </p>
          </div>
        ) : (
          notifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
              onArchive={archiveNotification}
            />
          ))
        )}
      </div>
    </main>
  );
}
