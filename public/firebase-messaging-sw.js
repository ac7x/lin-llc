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
  console.log('收到背景通知:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/notification-icon.png'
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 處理通知點擊
self.addEventListener('notificationclick', (event) => {
  console.log('通知被點擊:', event);

  event.notification.close();
  
  // 如果有點擊動作 URL，則開啟該頁面
  const urlToOpen = event.notification.data?.clickAction || '/';
  
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