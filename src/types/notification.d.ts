/**
 * 通知相關型別定義
 * 包含通知設定、通知消息、推播負載等資料結構
 * 用於管理系統中的通知功能
 */

/**
 * 通知設定型別
 */
export type NotificationSettings = {
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  notificationTypes: {
    projectUpdates: boolean;
    scheduleChanges: boolean;
    systemAlerts: boolean;
    workProgress: boolean;
    emergencyAlerts: boolean;
  };
  quietHours?: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
  };
};

/**
 * 通知消息型別
 */
export type NotificationMessage = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'project' | 'schedule' | 'system' | 'work' | 'emergency';
  isRead: boolean;
  isArchived: boolean;
  createdAt: string;
  readAt?: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  priority?: 'high' | 'normal' | 'low';
  expiresAt?: string;
  groupId?: string;
};

/**
 * 推播通知負載型別
 */
export type PushNotificationPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, unknown>;
  clickAction?: string;
  priority?: 'high' | 'normal' | 'low';
  ttl?: number;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  tag?: string;
};

/**
 * 通知記錄型別
 */
export type NotificationRecord = {
  id: string;
  userId: string;
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
  priority: 'high' | 'normal';
  status: 'pending' | 'sent' | 'failed';
  createdAt: Date;
  sentAt?: Date;
  error?: string;
};

/**
 * 通知偏好設定型別
 */
export type NotificationPreferences = {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  priority: 'high' | 'normal';
  categories: string[];
};

/**
 * 用戶裝置資訊型別
 */
export type UserDevice = {
  deviceId: string; // Firebase Installation ID
  fcmToken?: string; // FCM Token
  deviceType: 'web' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  lastActive: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}; 