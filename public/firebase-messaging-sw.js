/**
 * Firebase Cloud Messaging Service Worker
 * 處理推播通知的接收和顯示
 */

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCUDU4n6SvAQBT8qb1R0E_oWvSeJxYu-ro",
  authDomain: "lin-llc.firebaseapp.com",
  projectId: "lin-llc",
  storageBucket: "lin-llc.appspot.com",
  messagingSenderId: "394023041902",
  appId: "1:394023041902:web:f9874be5d0d192557b1f7f",
  measurementId: "G-62JEHK00G8",
});

const messaging = firebase.messaging();

// 處理背景通知
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, badge, image, data, clickAction } = payload.notification;

  const notificationOptions = {
    body,
    icon: icon || '/icons/notification-icon.png',
    badge: badge || '/icons/notification-badge.png',
    image,
    data,
    actions: clickAction ? [
      {
        action: 'open',
        title: '開啟'
      }
    ] : [],
    requireInteraction: true,
    vibrate: [200, 100, 200],
    tag: data?.groupId || 'default',
    renotify: true,
    silent: false
  };

  return self.registration.showNotification(title, notificationOptions);
});

// 處理通知點擊
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { data } = event.notification;
  const urlToOpen = data?.clickAction || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // 如果已經有開啟的視窗，則聚焦該視窗
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // 如果沒有開啟的視窗，則開啟新視窗
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
}); 