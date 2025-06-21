/**
 * Firebase 通知系統核心功能
 * 提供通知的建立、讀取、更新、刪除等基本操作
 * 包含通知快取機制、批量處理和即時訂閱功能
 * 支援通知的已讀狀態管理和封存功能
 */

import type { DocumentSnapshot, DocumentData } from 'firebase/firestore';

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
  deleteDoc,
} from '@/lib/firebase-client';
import type { AppUser } from '@/types/auth';
import type { NotificationMessage } from '@/types/notification';
import { getErrorMessage, logError, safeAsync, retry } from '@/utils/errorUtils';

import { COLLECTIONS } from './firebase-config';


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
  return await safeAsync(async () => {
    const notificationData = {
      ...notification,
      userId,
      isRead: false,
      isArchived: false,
      createdAt: serverTimestamp(),
    };

    const docRef = await retry(() => addDoc(collection(db, NOTIFICATIONS), notificationData), 3, 1000);
    return docRef.id;
  }, (error) => {
    logError(error, { operation: 'create_notification', userId });
    throw error;
  });
}

/**
 * 批量建立通知（例如系統廣播）
 */
export async function createBulkNotifications(
  userIds: string[],
  notification: Omit<NotificationMessage, 'id' | 'userId' | 'isRead' | 'isArchived' | 'createdAt'>
): Promise<void> {
  await safeAsync(async () => {
    const batch = writeBatch(db);
    
    userIds.forEach(userId => {
      const notificationData = {
        ...notification,
        userId,
        isRead: false,
        isArchived: false,
        createdAt: serverTimestamp(),
      };
      
      const docRef = doc(collection(db, NOTIFICATIONS));
      batch.set(docRef, notificationData);
    });
    
    await retry(() => batch.commit(), 3, 1000);
  }, (error) => {
    logError(error, { operation: 'create_bulk_notifications', userIds });
    throw error;
  });
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
  return await safeAsync(async () => {
    const { includeArchived = false, limitCount, onlyUnread = false } = options;
    
    let q = query(collection(db, NOTIFICATIONS), where('userId', '==', userId));
    
    if (!includeArchived) {
      q = query(q, where('isArchived', '==', false));
    }
    
    if (onlyUnread) {
      q = query(q, where('isRead', '==', false));
    }
    
    q = query(q, orderBy('createdAt', 'desc'));
    
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const snapshot = await retry(() => getDocs(q), 3, 1000);
    const notifications = snapshot.docs.map(docToNotification);
    
    return processNotificationsInMemory(notifications, { includeArchived, onlyUnread });
  }, (error) => {
    logError(error, { operation: 'get_user_notifications', userId, options });
    throw error;
  });
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
    }
  );

  return unsubscribe;
}

/**
 * 標記通知為已讀
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await safeAsync(async () => {
    const notificationRef = doc(db, NOTIFICATIONS, notificationId);
    await retry(() => updateDoc(notificationRef, {
      isRead: true,
      readAt: serverTimestamp(),
    }), 3, 1000);
  }, (error) => {
    logError(error, { operation: 'mark_notification_read', notificationId });
    throw error;
  });
}

/**
 * 批量標記通知為已讀
 */
export async function markMultipleNotificationsAsRead(notificationIds: string[]): Promise<void> {
  await safeAsync(async () => {
    const batch = writeBatch(db);
    
    notificationIds.forEach(notificationId => {
      const notificationRef = doc(db, NOTIFICATIONS, notificationId);
      batch.update(notificationRef, {
        isRead: true,
        readAt: serverTimestamp(),
      });
    });
    
    await retry(() => batch.commit(), 3, 1000);
  }, (error) => {
    logError(error, { operation: 'mark_multiple_notifications_read', notificationIds });
    throw error;
  });
}

/**
 * 標記所有通知為已讀
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await safeAsync(async () => {
    const q = query(
      collection(db, NOTIFICATIONS),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );
    
    const snapshot = await retry(() => getDocs(q), 3, 1000);
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        isRead: true,
        readAt: serverTimestamp(),
      });
    });
    
    if (snapshot.docs.length > 0) {
      await retry(() => batch.commit(), 3, 1000);
    }
  }, (error) => {
    logError(error, { operation: 'mark_all_notifications_read', userId });
    throw error;
  });
}

/**
 * 封存通知
 */
export async function archiveNotification(notificationId: string): Promise<void> {
  await safeAsync(async () => {
    const notificationRef = doc(db, NOTIFICATIONS, notificationId);
    await retry(() => updateDoc(notificationRef, {
      isArchived: true,
      archivedAt: serverTimestamp(),
    }), 3, 1000);
  }, (error) => {
    logError(error, { operation: 'archive_notification', notificationId });
    throw error;
  });
}

/**
 * 刪除通知 (軟刪除)
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await safeAsync(async () => {
    const notificationRef = doc(db, NOTIFICATIONS, notificationId);
    await retry(() => deleteDoc(notificationRef), 3, 1000);
  }, (error) => {
    logError(error, { operation: 'delete_notification', notificationId });
    throw error;
  });
}

/**
 * 取得未讀通知數量
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return await safeAsync(async () => {
    const q = query(
      collection(db, NOTIFICATIONS),
      where('userId', '==', userId),
      where('isRead', '==', false),
      where('isArchived', '==', false)
    );
    
    const snapshot = await retry(() => getDocs(q), 3, 1000);
    return snapshot.size;
  }, (error) => {
    logError(error, { operation: 'get_unread_notification_count', userId });
    return 0;
  });
}

/**
 * 更新用戶通知設定
 */
export async function updateUserNotificationSettings(
  userId: string,
  settings: Partial<AppUser['notificationSettings']>
): Promise<void> {
  await safeAsync(async () => {
    const userRef = doc(db, USERS, userId);
    await retry(() => updateDoc(userRef, {
      notificationSettings: settings,
      updatedAt: serverTimestamp(),
    }), 3, 1000);
  }, (error) => {
    logError(error, { operation: 'update_user_notification_settings', userId, settings });
    throw error;
  });
}
