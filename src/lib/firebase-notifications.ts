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
} from '@/lib/firebase-client';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { DocumentSnapshot, DocumentData, Timestamp } from 'firebase/firestore';
import { COLLECTIONS } from './firebase-config';
import type { NotificationMessage } from '@/types/notification';
import type { AppUser } from '@/types/auth';

const { NOTIFICATIONS, USERS } = COLLECTIONS;

interface FirebaseError extends Error {
  code?: string;
  message: string;
}

// #region 快取機制
const notificationCache = new Map<
  string,
  {
    data: NotificationMessage[];
    timestamp: number;
  }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分鐘快取

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
    timestamp: Date.now(),
  });
}
// #endregion

// #region 輔助函數
/** 移除物件中的 undefined 屬性 */
const cleanObject = <T extends object>(obj: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
};

/** 將 Firestore 文件快照轉換為通知物件 */
const docToNotification = (doc: DocumentSnapshot<DocumentData>): NotificationMessage => {
  const data = doc.data() as Omit<NotificationMessage, 'id'>;
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt, // Should be a Timestamp
    readAt: data.readAt, // Should be a Timestamp or undefined
  };
};

/** 在記憶體中處理通知的排序和過濾 */
const processNotificationsInMemory = (
  notifications: NotificationMessage[],
  options: { includeArchived?: boolean; onlyUnread?: boolean }
): NotificationMessage[] => {
  const { includeArchived, onlyUnread } = options;
  return notifications
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
    .filter(n => {
      if (onlyUnread && n.isRead) return false;
      if (!includeArchived && n.isArchived) return false;
      return true;
    });
};
// #endregion

/**
 * 建立新通知
 */
export async function createNotification(
  userId: string,
  notification: Omit<NotificationMessage, 'id' | 'userId' | 'isRead' | 'isArchived' | 'createdAt'>
): Promise<string> {
  try {
    const notificationData = {
      ...notification,
      userId,
      isRead: false,
      isArchived: false,
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, NOTIFICATIONS), cleanObject(notificationData));
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
  userIds: string[],
  notification: Omit<NotificationMessage, 'id' | 'userId' | 'isRead' | 'isArchived' | 'createdAt'>
): Promise<void> {
  try {
    const batch = writeBatch(db);
    userIds.forEach(userId => {
      const notificationRef = doc(collection(db, NOTIFICATIONS));
      const notificationData = {
        ...notification,
        userId,
        isRead: false,
        isArchived: false,
        createdAt: serverTimestamp(),
      };
      batch.set(notificationRef, cleanObject(notificationData));
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
  const { limitCount = 50, ...filterOptions } = options;

  try {
    const cached = getCachedNotifications(userId);
    if (cached) {
      return processNotificationsInMemory(cached, filterOptions);
    }

    const q = query(
      collection(db, NOTIFICATIONS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map(docToNotification);

    setCachedNotifications(userId, notifications);

    return processNotificationsInMemory(notifications, filterOptions);
  } catch (error) {
    const firebaseError = error as FirebaseError;
    if (
      firebaseError.code === 'failed-precondition' &&
      firebaseError.message.includes('requires an index')
    ) {
      console.warn(
        'Firestore 索引未建立，將在客戶端進行排序。查詢效能可能受到影響。',
        firebaseError.message
      );
      // 當索引不存在時，改用不含排序的備用查詢
      const fallbackQuery = query(
        collection(db, NOTIFICATIONS),
        where('userId', '==', userId),
        limit(limitCount)
      );
      const snapshot = await getDocs(fallbackQuery);
      const notifications = snapshot.docs.map(docToNotification);
      setCachedNotifications(userId, notifications);
      return processNotificationsInMemory(notifications, filterOptions);
    }
    console.error('Failed to get user notifications:', error);
    throw error;
  }
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
  const { limitCount = 50, ...filterOptions } = options;

  const q = query(
    collection(db, NOTIFICATIONS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const unsubscribe = onSnapshot(
    q,
    snapshot => {
      const notifications = snapshot.docs.map(docToNotification);
      callback(processNotificationsInMemory(notifications, filterOptions));
    },
    error => {
      const firebaseError = error as FirebaseError;
      if (
        firebaseError.code === 'failed-precondition' &&
        firebaseError.message.includes('requires an index')
      ) {
        console.warn('Firestore 索引未建立，訂閱功能將在客戶端進行排序。', firebaseError.message);

        // 取消原本的監聽
        unsubscribe();

        // 索引不存在時，使用不含排序的查詢
        const fallbackQuery = query(
          collection(db, NOTIFICATIONS),
          where('userId', '==', userId),
          limit(limitCount)
        );

        onSnapshot(fallbackQuery, snapshot => {
          const notifications = snapshot.docs.map(docToNotification);
          callback(processNotificationsInMemory(notifications, filterOptions));
        });
        return;
      }
      console.error('Failed to subscribe to notifications:', error);
    }
  );

  return unsubscribe;
}

/**
 * 標記通知為已讀
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
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
  if (notificationIds.length === 0) return;
  try {
    const batch = writeBatch(db);
    notificationIds.forEach(id => {
      const ref = doc(db, NOTIFICATIONS, id);
      batch.update(ref, { isRead: true, readAt: serverTimestamp() });
    });
    await batch.commit();
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
    const q = query(
      collection(db, NOTIFICATIONS),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach(docSnap => {
      batch.update(docSnap.ref, {
        isRead: true,
        readAt: serverTimestamp(),
      });
    });

    await batch.commit();
    notificationCache.clear();
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
 * 刪除通知 (軟刪除)
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  return archiveNotification(notificationId);
}

/**
 * 取得未讀通知數量
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const q = query(
      collection(db, NOTIFICATIONS),
      where('userId', '==', userId),
      where('isRead', '==', false),
      where('isArchived', '==', false)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    const firebaseError = error as FirebaseError;
    if (
      firebaseError.code === 'failed-precondition' &&
      firebaseError.message.includes('requires an index')
    ) {
      console.warn('缺少索引，未讀計數將從客戶端計算，可能不準確。', firebaseError.message);
      const fallbackQuery = query(collection(db, NOTIFICATIONS), where('userId', '==', userId));
      const snapshot = await getDocs(fallbackQuery);
      const notifications = snapshot.docs.map(docToNotification);
      return notifications.filter(n => !n.isRead && !n.isArchived).length;
    }
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
    const userRef = doc(db, USERS, userId);
    await updateDoc(userRef, {
      notificationSettings: settings,
    });
  } catch (error) {
    console.error('Failed to update notification settings:', error);
    throw error;
  }
}
