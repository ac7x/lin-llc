/**
 * Firebase Messaging Hook
 * 安全地處理 Firebase Cloud Messaging 功能
 * 確保只在客戶端環境中初始化和使用
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  getMessagingInstance, 
  getMessagingToken, 
  onMessage 
} from '@/lib/firebase-client';
import type { Messaging } from 'firebase/messaging';

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

  // 檢查是否在客戶端環境
  const isClient = typeof window !== 'undefined';

  useEffect(() => {
    if (!isClient) {
      setLoading(false);
      return;
    }

    try {
      const messagingInstance = getMessagingInstance();
      setMessaging(messagingInstance);
      
      if (messagingInstance) {
        // 監聽前台訊息
        const unsubscribe = onMessage(messagingInstance, (payload) => {
          console.log('收到前台訊息:', payload);
          
          // 可以在這裡處理前台通知顯示
          if (payload.notification) {
            // 顯示自定義通知
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(payload.notification.title || '新通知', {
                body: payload.notification.body,
                icon: '/icons/notification-icon.png'
              });
            }
          }
        });

        return () => {
          unsubscribe();
        };
      }
    } catch (err) {
      console.error('Firebase Messaging 初始化失敗:', err);
      setError('推播通知初始化失敗');
    } finally {
      setLoading(false);
    }
  }, [isClient]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isClient || !messaging) {
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // 請求通知權限
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // 取得 FCM token
        const token = await getMessagingToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });
        
        if (token) {
          setFcmToken(token);
          console.log('FCM Token:', token);
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
      const token = await getMessagingToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
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
    getToken
  };
} 