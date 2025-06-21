/**
 * Firebase Messaging Hook
 * 安全地處理 Firebase Cloud Messaging 功能
 * 確保只在客戶端環境中初始化和使用
 */

import type { Messaging } from 'firebase/messaging';
import { useEffect, useState, useCallback } from 'react';

import { firebaseApp } from '@/lib/firebase-client';
import { logError, safeAsync, retry } from '@/utils/errorUtils';

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

    await safeAsync(async () => {
      const { isSupported, getMessaging, onMessage } = await import('firebase/messaging');
      const supported = await retry(() => isSupported(), 3, 1000);

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
      }
    }, (error) => {
      setError('推播通知初始化失敗');
      logError(error, { operation: 'init_messaging' });
    });
    setLoading(false);
  }, [isClient]);

  useEffect(() => {
    initMessaging();
  }, [initMessaging]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isClient || !messaging) {
      return false;
    }

    const result = await safeAsync(async () => {
      setLoading(true);
      setError(null);
      
      const permission = await retry(() => Notification.requestPermission(), 3, 1000);

      if (permission === 'granted') {
        const { getToken } = await import('firebase/messaging');
        const token = await retry(() => getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        }), 3, 1000);

        if (token) {
          setFcmToken(token);
          return true;
        }
      } else {
        setError('通知權限被拒絕');
      }

      return false;
    }, (error) => {
      setError('無法取得通知權限');
      logError(error, { operation: 'request_messaging_permission' });
      return false;
    });
    
    return result ?? false;
  }, [isClient, messaging]);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!isClient || !messaging) {
      return null;
    }

    return await safeAsync(async () => {
      const { getToken } = await import('firebase/messaging');
      const token = await retry(() => getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      }), 3, 1000);

      if (token) {
        setFcmToken(token);
      }

      return token;
    }, (error) => {
      setError('無法取得推播通知 Token');
      logError(error, { operation: 'get_messaging_token' });
      return null;
    });
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
