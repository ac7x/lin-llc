import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useFirebase';
import { firebaseService } from '@/lib/services/firebase.service';
import type { NotificationMessage } from '@/types/user';
import { COLLECTIONS } from '@/lib/firebase-config';

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
  const { user } = useAuth();
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
      
      const notificationsQuery = firebaseService.createQuery<NotificationMessage>(
        `${COLLECTIONS.NOTIFICATIONS}/${user.uid}/messages`,
        [
          ...(onlyUnread ? [firebaseService.where('isRead', '==', false)] : []),
          ...(includeArchived ? [] : [firebaseService.where('isArchived', '==', false)]),
          firebaseService.orderBy('createdAt', 'desc'),
          firebaseService.limit(limitCount)
        ]
      );

      const [notificationsSnapshot, unreadCountSnapshot] = await Promise.all([
        firebaseService.getQuerySnapshot(notificationsQuery),
        firebaseService.getQuerySnapshot(
          firebaseService.createQuery<NotificationMessage>(
            `${COLLECTIONS.NOTIFICATIONS}/${user.uid}/messages`,
            [
              firebaseService.where('isRead', '==', false),
              firebaseService.where('isArchived', '==', false)
            ]
          )
        )
      ]);
      
      const notificationsData = notificationsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id
        } as NotificationMessage;
      });
      
      setNotifications(notificationsData);
      setUnreadCount(unreadCountSnapshot.size);
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

    const notificationsQuery = firebaseService.createQuery<NotificationMessage>(
      `${COLLECTIONS.NOTIFICATIONS}/${user.uid}/messages`,
      [
        ...(onlyUnread ? [firebaseService.where('isRead', '==', false)] : []),
        ...(includeArchived ? [] : [firebaseService.where('isArchived', '==', false)]),
        firebaseService.orderBy('createdAt', 'desc'),
        firebaseService.limit(limitCount)
      ]
    );

    // 訂閱通知更新
    const unsubscribeNotifications = firebaseService.onCollectionSnapshot<NotificationMessage>(
      notificationsQuery,
      (notificationsData) => {
        setNotifications(notificationsData);
        setLoading(false);
      }
    );

    // 訂閱未讀數量更新
    const unreadQuery = firebaseService.createQuery<NotificationMessage>(
      `${COLLECTIONS.NOTIFICATIONS}/${user.uid}/messages`,
      [
        firebaseService.where('isRead', '==', false),
        firebaseService.where('isArchived', '==', false)
      ]
    );

    const unsubscribeUnreadCount = firebaseService.onCollectionSnapshot<NotificationMessage>(
      unreadQuery,
      (notificationsData) => {
        setUnreadCount(notificationsData.length);
      }
    );

    return () => {
      unsubscribeNotifications();
      unsubscribeUnreadCount();
    };
  }, [user?.uid, includeArchived, limitCount, onlyUnread, realtime, loadNotifications]);

  // 標記單一通知為已讀
  const handleMarkAsRead = async (notificationId: string) => {
    if (!user?.uid) return;

    try {
      await firebaseService.updateDocument(
        `${COLLECTIONS.NOTIFICATIONS}/${user.uid}/messages/${notificationId}`,
        {
          isRead: true,
          readAt: firebaseService.timestamp()
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
      throw err;
    }
  };

  // 標記所有通知為已讀
  const handleMarkAllAsRead = async () => {
    if (!user?.uid) return;
    
    try {
      const batch = firebaseService.createBatch();
      const notificationsQuery = firebaseService.createQuery<NotificationMessage>(
        `${COLLECTIONS.NOTIFICATIONS}/${user.uid}/messages`,
        [
          firebaseService.where('isRead', '==', false),
          firebaseService.where('isArchived', '==', false)
        ]
      );

      const snapshot = await firebaseService.getQuerySnapshot(notificationsQuery);
      
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          isRead: true,
          readAt: firebaseService.timestamp()
        });
      });

      await batch.commit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
      throw err;
    }
  };

  // 封存通知
  const handleArchiveNotification = async (notificationId: string) => {
    if (!user?.uid) return;

    try {
      await firebaseService.updateDocument(
        `${COLLECTIONS.NOTIFICATIONS}/${user.uid}/messages/${notificationId}`,
        {
          isArchived: true
        }
      );
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
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unreadQuery = firebaseService.createQuery<NotificationMessage>(
      `${COLLECTIONS.NOTIFICATIONS}/${user.uid}/messages`,
      [
        firebaseService.where('isRead', '==', false),
        firebaseService.where('isArchived', '==', false)
      ]
    );

    const unsubscribe = firebaseService.onCollectionSnapshot<NotificationMessage>(
      unreadQuery,
      (notifications) => {
        setUnreadCount(notifications.length);
        setLoading(false);
        setError(null);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  return { unreadCount, loading, error };
}
