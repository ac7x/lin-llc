import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useFirebase'; // 使用 useAuth 而不是 useFirebase
import {
  getUserNotifications,
  subscribeToUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  archiveNotification,
} from '@/app/owner/notifications/firebase-notifications';
import type { NotificationMessage } from '@/types/user';

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

export function useNotifications(options: {
  includeArchived?: boolean;
  limitCount?: number;
  onlyUnread?: boolean;
  realtime?: boolean;
} = {}): UseNotificationsReturn {
  const { user } = useAuth(); // 使用 useAuth
  const { includeArchived = false, limitCount = 50, onlyUnread = false, realtime = true } = options;
  
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 取得通知資料
  const loadNotifications = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [notificationsData, unreadCountData] = await Promise.all([
        getUserNotifications(user.uid, { includeArchived, limitCount, onlyUnread }),
        getUnreadNotificationCount(user.uid),
      ]);
      
      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, includeArchived, limitCount, onlyUnread]);

  // 即時監聽通知更新
  useEffect(() => {
    if (!user?.uid || !realtime) {
      if (!realtime) {
        loadNotifications();
      }
      return;
    }

    setLoading(true);
    setError(null);

    // 訂閱通知更新
    const unsubscribeNotifications = subscribeToUserNotifications(
      user.uid,
      (notificationsData) => {
        setNotifications(notificationsData);
        setLoading(false);
      },
      { includeArchived, limitCount, onlyUnread }
    );

    // 載入未讀數量
    getUnreadNotificationCount(user.uid)
      .then(setUnreadCount)
      .catch((err) => {
        console.error('Failed to load unread count:', err);
      });

    // 訂閱未讀數量更新
    const unsubscribeUnreadCount = subscribeToUserNotifications(
      user.uid,
      (notificationsData) => {
        const unread = notificationsData.filter(n => !n.isRead && !n.isArchived).length;
        setUnreadCount(unread);
      },
      { includeArchived: false, onlyUnread: true }
    );

    return () => {
      unsubscribeNotifications();
      unsubscribeUnreadCount();
    };
  }, [user?.uid, includeArchived, limitCount, onlyUnread, realtime, loadNotifications]);

  // 標記單一通知為已讀
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      
      // 更新本地狀態
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      
      // 更新未讀數量
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
      throw err;
    }
  };

  // 標記所有通知為已讀
  const handleMarkAllAsRead = async () => {
    if (!user?.uid) return;
    
    try {
      await markAllNotificationsAsRead(user.uid);
      
      // 更新本地狀態
      setNotifications(prev => 
        prev.map(notification => 
          !notification.isRead 
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
      throw err;
    }
  };

  // 封存通知
  const handleArchiveNotification = async (notificationId: string) => {
    try {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive notification');
      throw err;
    }
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
  const { user } = useAuth(); // 使用 useAuth
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToUserNotifications(
      user.uid,
      (notifications) => {
        const unread = notifications.filter(n => !n.isRead && !n.isArchived).length;
        setUnreadCount(unread);
        setLoading(false);
      },
      { includeArchived: false, onlyUnread: true }
    );

    return unsubscribe;
  }, [user?.uid]);

  return { unreadCount, loading, error };
}
