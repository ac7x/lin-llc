/**
 * Firebase Cloud Messaging (FCM) 設定和工具
 * 提供 Web Push 通知相關功能
 */

import { getMessaging, getToken, onMessage, deleteToken, MessagePayload } from 'firebase/messaging';
import { firebaseApp } from './firebase-client';
import { db, doc, updateDoc, arrayUnion, arrayRemove } from './firebase-client';

const messaging = getMessaging(firebaseApp);

// FCM 設定
const FCM_CONFIG = {
  vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
  serviceWorkerPath: '/firebase-messaging-sw.js',
  tokenRefreshInterval: 24 * 60 * 60 * 1000, // 24小時
} as const;

// 檢查瀏覽器支援
export function isPushNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

// 請求通知權限
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('請求通知權限失敗:', error);
    return false;
  }
}

// 取得 FCM Token
export async function getFCMToken(): Promise<string | null> {
  try {
    if (!isPushNotificationSupported()) {
      console.log('瀏覽器不支援推播通知');
      return null;
    }

    const permission = await requestNotificationPermission();
    if (!permission) {
      console.log('用戶拒絕通知權限');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: FCM_CONFIG.vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.register(FCM_CONFIG.serviceWorkerPath),
    });

    return token;
  } catch (error) {
    console.error('取得 FCM Token 失敗:', error);
    return null;
  }
}

// 更新用戶的 FCM Token
export async function updateUserFCMToken(userId: string, token: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      fcmTokens: arrayUnion(token),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('更新用戶 FCM Token 失敗:', error);
    throw error;
  }
}

// 移除用戶的 FCM Token
export async function removeUserFCMToken(userId: string, token: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      fcmTokens: arrayRemove(token),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('移除用戶 FCM Token 失敗:', error);
    throw error;
  }
}

// 監聽 FCM 訊息
export function onFCMMessage(callback: (payload: MessagePayload) => void): () => void {
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
}

// 初始化 FCM
export async function initializeFCM(userId: string): Promise<void> {
  try {
    const token = await getFCMToken();
    if (token) {
      await updateUserFCMToken(userId, token);
    }
  } catch (error) {
    console.error('初始化 FCM 失敗:', error);
    throw error;
  }
}

// 清理 FCM
export async function cleanupFCM(userId: string): Promise<void> {
  try {
    const token = await getFCMToken();
    if (token) {
      await deleteToken(messaging);
      await removeUserFCMToken(userId, token);
    }
  } catch (error) {
    console.error('清理 FCM 失敗:', error);
    throw error;
  }
} 