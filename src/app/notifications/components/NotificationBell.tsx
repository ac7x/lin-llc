/**
 * 通知鈴鐺組件
 * 
 * 提供系統通知的視覺指示器，功能包含：
 * - 未讀通知計數顯示
 * - 通知下拉選單
 * - 多尺寸支援
 * - 通知摘要顯示
 * - 通知快速操作
 */

"use client";

import React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { useUnreadNotificationCount } from '@/app/notifications/hooks/useNotifications';
import Link from 'next/link';

interface NotificationBellProps {
  className?: string;
  showBadge?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function NotificationBell({ 
  className = '', 
  showBadge = true, 
  size = 'md' 
}: NotificationBellProps) {
  const { unreadCount, loading, error } = useUnreadNotificationCount();

  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const badgeClasses = {
    sm: 'text-xs min-w-[16px] h-4',
    md: 'text-xs min-w-[18px] h-[18px]',
    lg: 'text-sm min-w-[20px] h-5',
  };

  if (error) {
    return (
      <div className={`relative inline-block ${className}`} title={error}>
        <BellIcon className={`${sizeClasses[size]} text-red-500`} />
      </div>
    );
  }

  return (
    <Link href="/notifications" className={`relative inline-block ${className}`}>
      {unreadCount > 0 ? (
        <BellSolidIcon className={`${sizeClasses[size]} text-blue-500 hover:text-blue-600 transition-colors`} />
      ) : (
        <BellIcon className={`${sizeClasses[size]} text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 transition-colors`} />
      )}
      
      {showBadge && unreadCount > 0 && !loading && (
        <span className={`
          absolute -top-1 -right-1 
          ${badgeClasses[size]}
          bg-red-500 text-white rounded-full 
          flex items-center justify-center
          font-medium leading-none
          border-2 border-white dark:border-gray-900
        `}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}

// 簡單的通知摘要元件
interface NotificationSummaryProps {
  className?: string;
}

export function NotificationSummary({ className = '' }: NotificationSummaryProps) {
  const { unreadCount, loading, error } = useUnreadNotificationCount();

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 text-red-500 ${className}`} title={error}>
        <BellIcon className="h-4 w-4" />
        <span>載入失敗</span>
      </div>
    );
  }

  return (
    <Link 
      href="/notifications" 
      className={`flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors ${className}`}
    >
      <BellIcon className="h-4 w-4" />
      <span>
        {unreadCount > 0 ? `${unreadCount} 則未讀通知` : '沒有未讀通知'}
      </span>
    </Link>
  );
}
