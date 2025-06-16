/**
 * 用戶相關型別定義
 * 包含用戶資料、裝置資訊、通知設定等資料結構
 * 用於管理系統中的用戶資料和相關功能
 */

// 定義自訂的 AppUser 型別，專門用於描述我們的用戶資料結構
export interface AppUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
    role: string;
    roles: string[];
    permissions: string[];
    createdAt: string | Date;
    updatedAt: string | Date;
    lastLoginAt: string | Date;
    disabled?: boolean;
    metadata?: {
        creationTime?: string;
        lastSignInTime?: string;
    };
    notificationSettings?: {
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
}

// 擴展 Firebase User 型別
export interface ExtendedUser {
    customClaims?: {
        role?: string;
        roles?: string[];
        permissions?: string[];
    };
}
