/**
 * 通知系統 Hook
 * 提供通知的讀取、更新和狀態管理功能
 * 支援通知的即時更新和本地快取
 * 包含未讀通知計數和批量處理功能
 */

import { Timestamp } from 'firebase/firestore';
import { useState, useEffect, useCallback, useRef } from 'react';

import { useAuth } from '@/hooks/useAuth';
import {
  getUserNotifications,
  subscribeToUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  archiveNotification,
} from '@/lib/firebase-notifications';
import type { NotificationMessage } from '@/types/notification';
import { getErrorMessage, logError, safeAsync, retry } from '@/utils/errorUtils';

interface UseNotificationsReturn {
  notifications: NotificationMessage[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const CACHE_KEY = 'notifications_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 分鐘
const BATCH_SIZE = 10; // 批量處理大小

interface CacheData {
  notifications: NotificationMessage[];
  timestamp: number;
}

export function useNotifications(
  options: {
    includeArchived?: boolean;
    limitCount?: number;
    onlyUnread?: boolean;
    realtime?: boolean;
  } = {}
): UseNotificationsReturn {
  const { user } = useAuth();
  const { includeArchived = false, limitCount = 50, onlyUnread = false, realtime = true } = options;

  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const batchQueue = useRef<Set<string>>(new Set());
  const batchTimeout = useRef<NodeJS.Timeout | null>(null);

  // 檢查是否在客戶端環境
  const isClient = typeof window !== 'undefined';

  // 從本地緩存讀取數據
  const loadFromCache = useCallback(() => {
    if (!isClient) return null;

    return safeAsync(async () => {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { notifications: cachedNotifications, timestamp }: CacheData = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return cachedNotifications;
        }
      }
      return null;
    }, (error) => {
      logError(error, { operation: 'load_from_cache' });
      return null;
    });
  }, [isClient]);

  // 保存到本地緩存
  const saveToCache = useCallback(
    (data: NotificationMessage[]) => {
      if (!isClient) return;

      safeAsync(async () => {
        const cacheData: CacheData = {
          notifications: data,
          timestamp: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      }, (error) => {
        logError(error, { operation: 'save_to_cache' });
      });
    },
    [isClient]
  );

  // 取得通知資料
  const loadNotifications = useCallback(async () => {
    if (!user?.uid) return;

    setLoading(true);
    setError(null);

    await safeAsync(async () => {
      const notifications = await retry(() => getUserNotifications(user.uid, {
        includeArchived: options.includeArchived,
        limitCount: options.limitCount,
        onlyUnread: options.onlyUnread,
      }), 3, 1000);

      setNotifications(notifications);
      setUnreadCount(notifications.filter(n => !n.isRead).length);
    }, (error) => {
      setError(getErrorMessage(error));
      logError(error, { operation: 'load_notifications', userId: user.uid });
    });
    setLoading(false);
  }, [user?.uid, options.includeArchived, options.limitCount, options.onlyUnread]);

  // 批量處理標記已讀
  const processBatch = useCallback(async () => {
    if (batchQueue.current.size === 0) return;

    const batch = Array.from(batchQueue.current);
    batchQueue.current.clear();

    await safeAsync(async () => {
      await Promise.all(batch.map(id => markNotificationAsRead(id)));

      // 更新本地狀態
      setNotifications(prev =>
        prev.map(notification =>
          batch.includes(notification.id)
            ? { ...notification, isRead: true, readAt: Timestamp.now() }
            : notification
        )
      );

      // 更新未讀數量
      setUnreadCount(prev => Math.max(0, prev - batch.length));
    }, (error) => {
      setError(getErrorMessage(error));
      logError(error, { operation: 'process_batch', batchSize: batch.length });
    });
  }, []);

  // 標記單一通知為已讀
  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      batchQueue.current.add(notificationId);

      if (batchQueue.current.size >= BATCH_SIZE) {
        if (batchTimeout.current) {
          clearTimeout(batchTimeout.current);
        }
        await processBatch();
      } else {
        if (batchTimeout.current) {
          clearTimeout(batchTimeout.current);
        }
        batchTimeout.current = setTimeout(processBatch, 1000);
      }
    },
    [processBatch]
  );

  // 即時監聽通知更新
  useEffect(() => {
    if (!user?.uid || !realtime) {
      if (!realtime) {
        void loadNotifications();
      }
      return;
    }

    setLoading(true);
    setError(null);

    // 訂閱通知更新
    const unsubscribeNotifications = subscribeToUserNotifications(
      user.uid,
      (notificationsData: NotificationMessage[]) => {
        setNotifications(notificationsData);
        setLoading(false);
      },
      { includeArchived, limitCount, onlyUnread }
    );

    // 載入未讀數量
    safeAsync(async () => {
      const count = await getUnreadNotificationCount(user.uid);
      setUnreadCount(count);
      setLoading(false);
      setError(null);
    }, (error) => {
      setError(getErrorMessage(error));
      logError(error, { operation: 'get_unread_count', userId: user.uid });
      setLoading(false);
    });

    // 訂閱未讀數量更新
    const unsubscribeUnreadCount = subscribeToUserNotifications(
      user.uid,
      (notificationsData: NotificationMessage[]) => {
        const unread = notificationsData.filter(
          (n: NotificationMessage) => !n.isRead && !n.isArchived
        ).length;
        setUnreadCount(unread);
      },
      { includeArchived: false, onlyUnread: true }
    );

    return () => {
      unsubscribeNotifications();
      unsubscribeUnreadCount();
      if (batchTimeout.current) {
        clearTimeout(batchTimeout.current);
      }
    };
  }, [user?.uid, includeArchived, limitCount, onlyUnread, realtime, loadNotifications]);

  // 標記所有通知為已讀
  const handleMarkAllAsRead = async () => {
    if (!user?.uid) return;

    await safeAsync(async () => {
      await markAllNotificationsAsRead(user.uid);

      // 更新本地狀態
      setNotifications(prev =>
        prev.map(notification =>
          !notification.isRead
            ? { ...notification, isRead: true, readAt: Timestamp.now() }
            : notification
        )
      );

      setUnreadCount(0);
    }, (error) => {
      setError(getErrorMessage(error));
      logError(error, { operation: 'mark_all_as_read', userId: user.uid });
      throw error;
    });
  };

  // 封存通知
  const handleArchiveNotification = async (notificationId: string) => {
    await safeAsync(async () => {
      await archiveNotification(notificationId);

      // 如果不包含已封存的通知，從列表中移除
      if (!includeArchived) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      } else {
        // 更新本地狀態
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, isArchived: true }
              : notification
          )
        );
      }

      // 如果通知未讀，則減少未讀數量
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }, (error) => {
      setError(getErrorMessage(error));
      logError(error, { operation: 'archive_notification', notificationId });
      throw error;
    });
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    archiveNotification: handleArchiveNotification,
    refreshNotifications: loadNotifications,
  };
}

// 快速取得未讀數量的 Hook
export function useUnreadNotificationCount(): {
  unreadCount: number;
  loading: boolean;
  error: string | null;
} {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToUserNotifications(
      user.uid,
      (notifications: NotificationMessage[]) => {
        const unread = notifications.filter(
          (n: NotificationMessage) => !n.isRead && !n.isArchived
        ).length;
        setUnreadCount(unread);
        setLoading(false);
        setError(null);
      },
      { includeArchived: false, onlyUnread: true }
    );

    // 初始載入未讀數量
    safeAsync(async () => {
      const count = await getUnreadNotificationCount(user.uid);
      setUnreadCount(count);
      setLoading(false);
      setError(null);
    }, (error) => {
      setError(getErrorMessage(error));
      logError(error, { operation: 'get_unread_count', userId: user.uid });
      setLoading(false);
    });

    return unsubscribe;
  }, [user?.uid]);

  return { unreadCount, loading, error };
}
