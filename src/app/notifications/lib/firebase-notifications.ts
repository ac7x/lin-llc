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
  db // 直接從 firebase-client 匯入 db
} from '@/lib/firebase-client'; // 直接從 lib 匯入
import { Firestore } from 'firebase/firestore'; // Firestore 型別正確來源
import { COLLECTIONS } from '../../../lib/firebase-config';
import type { NotificationMessage } from '@/app/notifications/types/notifications';
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
  db: Firestore, // 直接傳入 db
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
    console.error('Failed to create notification:', error);
    throw error;
  }
}

/**
 * 批量建立通知（例如系統廣播）
 */
export async function createBulkNotifications(
  db: Firestore, // 直接傳入 db
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
    console.error('Failed to create bulk notifications:', error);
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
 * 更新用戶通知設定
 */
export async function updateUserNotificationSettings(
  userId: string,
  settings: Partial<AppUser['notificationSettings']>
): Promise<void> {
  try {
    // 直接使用 db
    const userRef = doc(db, USERS, userId);
    await updateDoc(userRef, {
      'notificationSettings': settings,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to update notification settings:', error);
    throw error;
  }
}
