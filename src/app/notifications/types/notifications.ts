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
  data?: Record<string, unknown>; // 額外的數據，如相關的專案ID等
  actionUrl?: string; // 點擊通知後跳轉的URL
};

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
};
