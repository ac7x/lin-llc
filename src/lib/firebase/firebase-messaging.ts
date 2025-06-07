import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';
import { firebaseApp } from './firebase-client';
import { getAppCheckToken } from './firebase-appcheck';
import { getFirebaseInstallationId } from './firebase-installations';

const messaging = getMessaging(firebaseApp);
const VAPID_KEY = 'BJqXrpJBAZeJODEGXNxnAJ2OPCYHxYgKALbJzviUcI9LajYXPbfgeEJ575qTEPqoCNDb9S8ZsaN-hHcg9aSmauk';

export async function initializeMessaging(): Promise<string | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  const appCheckToken = await getAppCheckToken();
  if (!appCheckToken) return null;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;
  return await getToken(messaging, { vapidKey: VAPID_KEY }) || null;
}

export async function getCurrentDeviceInfo(): Promise<any> {
  const deviceId = await getFirebaseInstallationId();
  const fcmToken = await initializeMessaging();
  if (!deviceId) return null;
  return { deviceId, fcmToken };
}

export function setupOnMessageListener(onNotificationReceived?: (payload: any) => void): void {
  onMessage(messaging, (payload) => {
    const notification = {
      title: payload.notification?.title || 'New Notification',
      body: payload.notification?.body || '',
    };
    onNotificationReceived?.(notification);
    if (Notification.permission === 'granted') {
      new Notification(notification.title, { body: notification.body });
    }
  });
}

export async function deleteFCMToken(): Promise<boolean> {
  try {
    await deleteToken(messaging);
    return true;
  } catch {
    return false;
  }
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'default';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'default';
  return await Notification.requestPermission();
}