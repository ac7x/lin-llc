// firebase-messaging-sw.js

// 引入 Firebase 兼容版本的核心與 messaging 腳本
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js');

// 初始化 Firebase app
firebase.initializeApp({
  apiKey: "AIzaSyCUDU4n6SvAQBT8qb1R0E_oWvSeJxYu-ro",
  authDomain: "lin-llc.firebaseapp.com",
  projectId: "lin-llc",
  storageBucket: "lin-llc.appspot.com",
  messagingSenderId: "394023041902",
  appId: "1:394023041902:web:f9874be5d0d192557b1f7f",
  measurementId: "G-62JEHK00G8"
});

// 取得 messaging 物件
const messaging = firebase.messaging();

// 處理背景訊息
messaging.onBackgroundMessage(async function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // 解析通知資料
  const notification = payload.notification || {};
  const data = payload.data || {};
  
  // 自訂通知內容
  const notificationTitle = notification.title || data.title || 'Lin LLC 通知';
  const notificationOptions = {
    body: notification.body || data.body || '您有新的通知',
    icon: notification.icon || data.icon || '/favicon.ico',
    badge: notification.badge || data.badge || '/favicon.ico',
    image: notification.image || data.image,
    data: {
      ...data,
      url: data.actionUrl || data.url || '/owner/notifications',
      notificationId: data.notificationId,
      category: data.category,
      type: data.type,
    },
    actions: [
      {
        action: 'view',
        title: '查看',
        icon: '/favicon.ico'
      },
      {
        action: 'dismiss',
        title: '忽略'
      }
    ],
    requireInteraction: data.type === 'emergency', // 緊急通知需要用戶互動
    silent: false,
    tag: data.category || 'general', // 用於分組相似通知
  };

  // 顯示通知
  await self.registration.showNotification(notificationTitle, notificationOptions);
});

// 監聽通知點擊事件
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  // 關閉通知
  notification.close();

  if (action === 'dismiss') {
    // 用戶選擇忽略，不做任何動作
    return;
  }

  // 決定要打開的 URL
  let targetUrl = data.url || '/owner/notifications';
  
  // 如果有特定的動作 URL，使用它
  if (data.actionUrl) {
    targetUrl = data.actionUrl;
  }

  // 如果是查看動作或直接點擊通知
  if (action === 'view' || !action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        // 尋找是否已有打開的視窗
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // 如果找到同源的視窗，聚焦並導航到目標 URL
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: targetUrl,
              notificationData: data
            });
            return;
          }
        }
        
        // 如果沒有找到視窗，打開新視窗
        if (clients.openWindow) {
          const fullUrl = self.location.origin + targetUrl;
          return clients.openWindow(fullUrl);
        }
      })
    );
  }
});

// 監聽通知關閉事件
self.addEventListener('notificationclose', function(event) {
  console.log('[firebase-messaging-sw.js] Notification closed.');
  
  const data = event.notification.data || {};
  
  // 可以在這裡記錄通知關閉的分析數據
  // 例如：發送到 Firebase Analytics
});

// 監聽來自主執行緒的訊息
self.addEventListener('message', function(event) {
  console.log('[firebase-messaging-sw.js] Received message from main thread:', event.data);
  
  if (event.data && event.data.type === 'UPDATE_NOTIFICATION_COUNT') {
    // 更新 badge 數量（如果瀏覽器支援）
    if ('setAppBadge' in navigator) {
      const count = event.data.count || 0;
      if (count > 0) {
        navigator.setAppBadge(count);
      } else {
        navigator.clearAppBadge();
      }
    }
  }
});

// 處理推送事件（如果需要自訂處理）
self.addEventListener('push', function(event) {
  console.log('[firebase-messaging-sw.js] Push event received:', event);
  
  // Firebase Messaging 會自動處理推送事件
  // 這裡可以添加額外的自訂邏輯
});
