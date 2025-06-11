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
import type { NotificationMessage, AppUser } from '@/types/user';

const { NOTIFICATIONS, USERS } = COLLECTIONS;

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
    // 直接使用 db
    const { includeArchived = false, limitCount = 50, onlyUnread = false } = options;

    let q = query(
      collection(db, NOTIFICATIONS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    if (!includeArchived) {
      q = query(q, where('isArchived', '==', false));
    }

    if (onlyUnread) {
      q = query(q, where('isRead', '==', false));
    }

    if (limitCount > 0) {
      q = query(q, limit(limitCount));
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      readAt: doc.data().readAt?.toDate?.()?.toISOString() || doc.data().readAt,
    })) as NotificationMessage[];
  } catch (error) {
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
  // 直接使用 db
  const { includeArchived = false, limitCount = 50, onlyUnread = false } = options;

  let q = query(
    collection(db, NOTIFICATIONS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  if (!includeArchived) {
    q = query(q, where('isArchived', '==', false));
  }

  if (onlyUnread) {
    q = query(q, where('isRead', '==', false));
  }

  if (limitCount > 0) {
    q = query(q, limit(limitCount));
  }

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      readAt: doc.data().readAt?.toDate?.()?.toISOString() || doc.data().readAt,
    })) as NotificationMessage[];

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
    // 直接使用 db
    const batch = writeBatch(db);

    notificationIds.forEach((notificationId) => {
      const notificationRef = doc(db, NOTIFICATIONS, notificationId);
      batch.update(notificationRef, {
        isRead: true,
        readAt: serverTimestamp(),
      });
    });

    await batch.commit();
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
    // 直接使用 db
    const q = query(
      collection(db, NOTIFICATIONS),
      where('userId', '==', userId),
      where('isRead', '==', false),
      where('isArchived', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
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
