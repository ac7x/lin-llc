/**
 * Firebase 通知系統核心功能
 * 提供通知的建立、讀取、更新、刪除等基本操作
 * 包含通知快取機制、批量處理和即時訂閱功能
 * 支援通知的已讀狀態管理和封存功能
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  db,
  getDoc
} from '@/lib/firebase-client';
import { Firestore } from 'firebase/firestore';
import { COLLECTIONS } from '../../../lib/firebase-config';
import type { NotificationMessage, PushNotificationPayload } from '@/types/notification';
import type { AppUser } from '@/types/user';

const { NOTIFICATIONS, USERS } = COLLECTIONS;

interface FirebaseError extends Error {
  code?: string;
  message: string;
}

// 新增快取機制
const notificationCache = new Map<string, {
  data: NotificationMessage[];
  timestamp: number;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5分鐘快取

// 快取管理函數
function getCachedNotifications(userId: string): NotificationMessage[] | null {
  const cached = notificationCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedNotifications(userId: string, notifications: NotificationMessage[]): void {
  notificationCache.set(userId, {
    data: notifications,
    timestamp: Date.now()
  });
}

/**
 * 建立新通知
 */
export async function createNotification(
  db: Firestore,
  userId: string,
  notification: Omit<NotificationMessage, 'id' | 'userId' | 'isRead' | 'isArchived' | 'createdAt'>
): Promise<string> {
  try {
    const notificationData: Omit<NotificationMessage, 'id'> = {
      ...notification,
      userId,
      isRead: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, NOTIFICATIONS), {
      ...notificationData,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('建立通知失敗:', error);
    throw error;
  }
}

/**
 * 批量建立通知
 */
export async function createBulkNotifications(
  db: Firestore,
  userIds: string[],
  notification: Omit<NotificationMessage, 'id' | 'userId' | 'isRead' | 'isArchived' | 'createdAt'>
): Promise<void> {
  try {
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    userIds.forEach((userId) => {
      const notificationRef = doc(collection(db, NOTIFICATIONS));
      const notificationData: Omit<NotificationMessage, 'id'> = {
        ...notification,
        userId,
        isRead: false,
        isArchived: false,
        createdAt: now,
      };

      batch.set(notificationRef, {
        ...notificationData,
        createdAt: serverTimestamp(),
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('批量建立通知失敗:', error);
    throw error;
  }
}

/**
 * 取得用戶的通知列表
 */
export async function getUserNotifications(
  userId: string,
  options: {
    includeArchived?: boolean;
    limitCount?: number;
    onlyUnread?: boolean;
  } = {}
): Promise<NotificationMessage[]> {
  try {
    const { includeArchived = false, limitCount = 50, onlyUnread = false } = options;

    // 檢查快取
    const cached = getCachedNotifications(userId);
    if (cached) {
      return cached.filter(n => {
        if (!includeArchived && n.isArchived) return false;
        if (onlyUnread && n.isRead) return false;
        return true;
      });
    }

    // 優化查詢條件
    const conditions = [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ];

    if (!includeArchived) {
      conditions.push(where('isArchived', '==', false));
    }
    if (onlyUnread) {
      conditions.push(where('isRead', '==', false));
    }

    const q = query(collection(db, NOTIFICATIONS), ...conditions);

    try {
      const snapshot = await getDocs(q);
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        readAt: doc.data().readAt?.toDate?.()?.toISOString() || doc.data().readAt,
      })) as NotificationMessage[];

      // 更新快取
      setCachedNotifications(userId, notifications);
      return notifications;
    } catch (error: unknown) {
      const firebaseError = error as FirebaseError;
      if (firebaseError.code === 'failed-precondition' && firebaseError.message.includes('requires an index')) {
        console.warn('使用基本查詢...');
        return await getBasicNotifications(userId, options);
      }
      throw error;
    }
  } catch (error) {
    console.error('Failed to get user notifications:', error);
    throw error;
  }
}

// 基本查詢函數
async function getBasicNotifications(
  userId: string,
  options: {
    includeArchived?: boolean;
    limitCount?: number;
    onlyUnread?: boolean;
  }
): Promise<NotificationMessage[]> {
  const { includeArchived = false, limitCount = 50, onlyUnread = false } = options;

  const q = query(
    collection(db, NOTIFICATIONS),
    where('userId', '==', userId),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  let notifications = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
    readAt: doc.data().readAt?.toDate?.()?.toISOString() || doc.data().readAt,
  })) as NotificationMessage[];

  notifications = notifications
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter(n => {
      if (!includeArchived && n.isArchived) return false;
      if (onlyUnread && n.isRead) return false;
      return true;
    });

  setCachedNotifications(userId, notifications);
  return notifications;
}

/**
 * 監聽用戶通知的即時更新
 */
export function subscribeToUserNotifications(
  userId: string,
  callback: (notifications: NotificationMessage[]) => void,
  options: {
    includeArchived?: boolean;
    limitCount?: number;
    onlyUnread?: boolean;
  } = {}
): () => void {
  const { includeArchived = false, limitCount = 50, onlyUnread = false } = options;

  // 使用基本查詢
  const q = query(
    collection(db, NOTIFICATIONS),
    where('userId', '==', userId),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    let notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      readAt: doc.data().readAt?.toDate?.()?.toISOString() || doc.data().readAt,
    })) as NotificationMessage[];

    // 在記憶體中進行排序和過濾
    notifications = notifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (!includeArchived) {
      notifications = notifications.filter(n => !n.isArchived);
    }
    if (onlyUnread) {
      notifications = notifications.filter(n => !n.isRead);
    }

    callback(notifications);
  }, (error) => {
    console.error('Failed to subscribe to notifications:', error);
  });
}

/**
 * 標記通知為已讀
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    // 直接使用 db
    const notificationRef = doc(db, NOTIFICATIONS, notificationId);
    await updateDoc(notificationRef, {
      isRead: true,
      readAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    throw error;
  }
}

/**
 * 批量標記通知為已讀
 */
export async function markMultipleNotificationsAsRead(notificationIds: string[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    const now = serverTimestamp();

    // 分批處理，每批最多 500 個操作
    const BATCH_SIZE = 500;
    for (let i = 0; i < notificationIds.length; i += BATCH_SIZE) {
      const batchIds = notificationIds.slice(i, i + BATCH_SIZE);
      batchIds.forEach((notificationId) => {
        const notificationRef = doc(db, NOTIFICATIONS, notificationId);
        batch.update(notificationRef, {
          isRead: true,
          readAt: now,
        });
      });
      await batch.commit();
    }

    // 清除相關快取
    notificationCache.clear();
  } catch (error) {
    console.error('Failed to mark multiple notifications as read:', error);
    throw error;
  }
}

/**
 * 標記所有通知為已讀
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    // 直接使用 db
    const q = query(
      collection(db, NOTIFICATIONS),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        isRead: true,
        readAt: serverTimestamp(),
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    throw error;
  }
}

/**
 * 封存通知
 */
export async function archiveNotification(notificationId: string): Promise<void> {
  try {
    // 直接使用 db
    const notificationRef = doc(db, NOTIFICATIONS, notificationId);
    await updateDoc(notificationRef, {
      isArchived: true,
    });
  } catch (error) {
    console.error('Failed to archive notification:', error);
    throw error;
  }
}

/**
 * 刪除通知
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    // 直接使用 db
    const notificationRef = doc(db, NOTIFICATIONS, notificationId);
    await updateDoc(notificationRef, {
      isArchived: true, // 軟刪除，實際上是封存
    });
  } catch (error) {
    console.error('Failed to delete notification:', error);
    throw error;
  }
}

/**
 * 取得未讀通知數量
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    // 使用基本查詢
    const q = query(
      collection(db, NOTIFICATIONS),
      where('userId', '==', userId)
    );

    try {
      const snapshot = await getDocs(q);
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as NotificationMessage[];

      return notifications.filter(n => !n.isRead && !n.isArchived).length;
    } catch (error: unknown) {
      const firebaseError = error as FirebaseError;
      if (firebaseError.code === 'failed-precondition' && firebaseError.message.includes('requires an index')) {
        console.warn('等待索引建立中，使用基本查詢...');
        return 0; // 在索引建立期間返回 0
      }
      throw error;
    }
  } catch (error) {
    console.error('Failed to get unread notification count:', error);
    return 0;
  }
}

/**
 * 發送推播通知
 */
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<void> {
  try {
    const userRef = doc(db, USERS, userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data() as AppUser;

    if (!userData?.notificationSettings?.enablePushNotifications) {
      console.log('用戶已停用推播通知');
      return;
    }

    // 檢查靜音時段
    const settings = userData.notificationSettings;
    if (settings.quietHours?.enabled) {
      const now = new Date();
      const [startHour, startMinute] = settings.quietHours.startTime.split(':').map(Number);
      const [endHour, endMinute] = settings.quietHours.endTime.split(':').map(Number);
      
      const startTime = new Date();
      startTime.setHours(startHour, startMinute, 0);
      
      const endTime = new Date();
      endTime.setHours(endHour, endMinute, 0);
      
      if (now >= startTime && now <= endTime) {
        console.log('目前處於靜音時段');
        return;
      }
    }

    // 檢查用戶是否有 FCM Token
    if (!userData.fcmTokens?.length) {
      throw new Error('用戶沒有註冊的 FCM Token');
    }

    // 建立通知記錄
    const notificationId = await createNotification(db, userId, {
      title: payload.title,
      message: payload.body,
      type: 'info',
      category: 'system',
      data: payload.data,
      actionUrl: payload.clickAction,
      priority: payload.priority || 'normal',
    });

    // 發送 FCM 推播
    if (userData.fcmTokens?.length > 0) {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon,
          badge: payload.badge,
          image: payload.image,
        },
        data: {
          ...payload.data,
          notificationId,
          clickAction: payload.clickAction,
          groupId: payload.tag,
        },
        android: {
          priority: payload.priority || 'normal',
          ttl: payload.ttl || 24 * 60 * 60 * 1000, // 24小時
          notification: {
            channelId: 'default',
            priority: payload.priority || 'normal',
            defaultSound: true,
            defaultVibrateTimings: true,
            defaultLightSettings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              contentAvailable: true,
              mutableContent: true,
            },
          },
          headers: {
            'apns-priority': payload.priority === 'high' ? '10' : '5',
            'apns-expiration': payload.ttl ? String(Math.floor(Date.now() / 1000) + payload.ttl) : undefined,
          },
        },
        webpush: {
          headers: {
            Urgency: payload.priority || 'normal',
            TTL: payload.ttl ? String(payload.ttl / 1000) : '86400',
          },
          notification: {
            requireInteraction: payload.requireInteraction ?? true,
            silent: payload.silent ?? false,
            vibrate: payload.vibrate || [200, 100, 200],
            tag: payload.tag,
            renotify: true,
            actions: payload.clickAction ? [
              {
                action: 'open',
                title: '開啟'
              }
            ] : [],
          },
        },
        tokens: userData.fcmTokens,
      };

      // 使用 Firebase Admin SDK 發送推播
      // 注意：這需要在後端實作
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
    }
  } catch (error) {
    console.error('發送推播通知失敗:', error);
    throw error;
  }
}

/**
 * 更新用戶通知設定
 */
export async function updateUserNotificationSettings(
  userId: string,
  settings: Partial<AppUser['notificationSettings']>
): Promise<void> {
  try {
    const userRef = doc(db, USERS, userId);
    await updateDoc(userRef, {
      'notificationSettings': settings,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('更新通知設定失敗:', error);
    throw error;
  }
}
