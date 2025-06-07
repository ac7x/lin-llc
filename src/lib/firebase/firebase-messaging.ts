import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';
import { firebaseApp } from './firebase-client';
import { getAppCheckToken } from './firebase-appcheck';
import { getFirebaseInstallationId } from './firebase-installations';
import type { PushNotificationPayload, UserDevice } from '@/types/user';

const messaging = getMessaging(firebaseApp);

// VAPID 公鑰 - 需要在 Firebase Console 中生成
const VAPID_KEY = 'BJqXrpJBAZeJODEGXNxnAJ2OPCYHxYgKALbJzviUcI9LajYXPbfgeEJ575qTEPqoCNDb9S8ZsaN-hHcg9aSmauk';

/**
 * 初始化推播並取得 FCM Token
 */
export async function initializeMessaging(): Promise<string | null> {
  try {
    // 檢查瀏覽器環境
    if (typeof window === 'undefined') {
      console.warn('Messaging can only be initialized in browser environment');
      return null;
    }

    // 檢查 Service Worker 支援
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return null;
    }

    // 確保 App Check Token 已初始化
    const appCheckToken = await getAppCheckToken();
    if (!appCheckToken) {
      throw new Error('App Check token is not available.');
    }

    // 請求通知權限
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    // 取得 FCM Token
    const fcmToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    });

    if (fcmToken) {
      console.log('FCM Token obtained:', fcmToken);
      return fcmToken;
    } else {
      console.warn('No FCM token retrieved.');
      return null;
    }
  } catch (error) {
    console.error('Failed to initialize messaging:', error);
    return null;
  }
}

/**
 * 取得當前裝置資訊
 */
export async function getCurrentDeviceInfo(): Promise<Partial<UserDevice> | null> {
  try {
    const deviceId = await getFirebaseInstallationId();
    const fcmToken = await initializeMessaging();
    
    if (!deviceId) return null;

    // 檢測裝置類型
    const getDeviceType = (): 'web' | 'mobile' | 'tablet' => {
      const userAgent = navigator.userAgent.toLowerCase();
      if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
      if (/mobile|iphone|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
      return 'web';
    };

    // 檢測瀏覽器
    const getBrowser = (): string => {
      const userAgent = navigator.userAgent;
      if (userAgent.includes('Chrome')) return 'Chrome';
      if (userAgent.includes('Firefox')) return 'Firefox';
      if (userAgent.includes('Safari')) return 'Safari';
      if (userAgent.includes('Edge')) return 'Edge';
      return 'Unknown';
    };

    // 檢測作業系統
    const getOS = (): string => {
      const userAgent = navigator.userAgent;
      if (userAgent.includes('Windows')) return 'Windows';
      if (userAgent.includes('Mac')) return 'macOS';
      if (userAgent.includes('Linux')) return 'Linux';
      if (userAgent.includes('Android')) return 'Android';
      if (userAgent.includes('iOS')) return 'iOS';
      return 'Unknown';
    };

    const now = new Date().toISOString();
    
    return {
      deviceId,
      fcmToken: fcmToken || undefined,
      deviceType: getDeviceType(),
      browser: getBrowser(),
      os: getOS(),
      lastActive: now,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error('Failed to get device info:', error);
    return null;
  }
}

/**
 * 設置前台訊息監聽
 */
export function setupOnMessageListener(
  onNotificationReceived?: (payload: PushNotificationPayload) => void
): void {
  onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);
    
    const notification: PushNotificationPayload = {
      title: payload.notification?.title || 'New Notification',
      body: payload.notification?.body || '',
      icon: payload.notification?.icon,
      badge: payload.data?.badge as string,
      image: payload.data?.image as string,
      data: payload.data,
      clickAction: payload.fcmOptions?.link,
    };

    // 呼叫自訂處理函式
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }

    // 在前台顯示通知（可選）
    if (Notification.permission === 'granted') {
      const notificationOptions: NotificationOptions = {
        body: notification.body,
        icon: notification.icon,
        badge: notification.badge,
        data: notification.data,
        tag: payload.data?.category || 'general',
        requireInteraction: payload.data?.type === 'emergency',
      };

      // 只有在支援的情況下才添加 image 屬性
      if ('image' in Notification.prototype && notification.image) {
        (notificationOptions as NotificationOptions & { image?: string }).image = notification.image;
      }

      new Notification(notification.title, notificationOptions);
    }
  });
}

/**
 * 刪除 FCM Token（登出時使用）
 */
export async function deleteFCMToken(): Promise<boolean> {
  try {
    await deleteToken(messaging);
    console.log('FCM Token deleted successfully');
    return true;
  } catch (error) {
    console.error('Failed to delete FCM token:', error);
    return false;
  }
}

/**
 * 檢查通知權限狀態
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'default';
  }
  return Notification.permission;
}

/**
 * 請求通知權限
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'default';
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return 'default';
  }
}