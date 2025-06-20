/**
 * Firebase Messaging Hook
 * 安全地處理 Firebase Cloud Messaging 功能
 * 確保只在客戶端環境中初始化和使用
 */

import type { Messaging } from 'firebase/messaging';
import { useState, useEffect, useCallback } from 'react';

import { firebaseApp } from '@/lib/firebase-client';

interface UseFirebaseMessagingReturn {
  messaging: Messaging | null;
  fcmToken: string | null;
  loading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  getToken: () => Promise<string | null>;
}

export function useFirebaseMessaging(): UseFirebaseMessagingReturn {
  const [messaging, setMessaging] = useState<Messaging | null>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isClient = typeof window !== 'undefined';

  const initMessaging = useCallback(async () => {
    if (!isClient) {
      setLoading(false);
      return;
    }

    try {
      const { isSupported, getMessaging, onMessage } = await import('firebase/messaging');
      const supported = await isSupported();

      if (supported) {
        const messagingInstance = getMessaging(firebaseApp);
        setMessaging(messagingInstance);

        const unsubscribe = onMessage(messagingInstance, payload => {
          if (payload.notification) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(payload.notification.title || '新通知', {
                body: payload.notification.body,
                icon: '/icons/notification-icon.png', // 假設您有此圖示
              });
            }
          }
        });

        return () => unsubscribe();
      } else {
        console.warn('Firebase Messaging is not supported in this browser context.');
      }
    } catch (err) {
      console.error('Firebase Messaging 初始化失敗:', err);
      setError('推播通知初始化失敗');
    } finally {
      setLoading(false);
    }
  }, [isClient]);

  useEffect(() => {
    initMessaging();
  }, [initMessaging]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isClient || !messaging) {
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        const { getToken } = await import('firebase/messaging');
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });

        if (token) {
          setFcmToken(token);
          return true;
        }
      } else {
        setError('通知權限被拒絕');
      }

      return false;
    } catch (err) {
      console.error('請求通知權限失敗:', err);
      setError('無法取得通知權限');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isClient, messaging]);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!isClient || !messaging) {
      return null;
    }

    try {
      const { getToken } = await import('firebase/messaging');
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      if (token) {
        setFcmToken(token);
      }

      return token;
    } catch (err) {
      console.error('取得 FCM Token 失敗:', err);
      setError('無法取得推播通知 Token');
      return null;
    }
  }, [isClient, messaging]);

  return {
    messaging,
    fcmToken,
    loading,
    error,
    requestPermission,
    getToken,
  };
}
