// 定義自訂的 AppUser 型別，專門用於描述我們的用戶資料結構
export type AppUser = {
    uid: string;
    email: string;
    displayName: string;
    emailVerified: boolean;
    photoURL: string;
    disabled: boolean;
    role: string;
    metadata: {
        creationTime: string;
        lastSignInTime: string;
    };
    // 裝置識別相關
    devices?: UserDevice[];
    // 通知設定
    notificationSettings?: NotificationSettings;
};

// 用戶裝置資訊
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

// 通知設定
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

// 通知消息型別
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

// 推播通知負載
export type PushNotificationPayload = {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    image?: string;
    data?: Record<string, unknown>;
    clickAction?: string;
};
