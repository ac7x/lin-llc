import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { safeAsync, retry, getErrorMessage, logError } from '@/utils/errorUtils';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  department?: string;
  position?: string;
  bio?: string;
  preferences?: {
    notifications: boolean;
    emailUpdates: boolean;
    darkMode: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class ProfileService {
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    return await safeAsync(async () => {
      const userRef = doc(db, 'members', userId);
      const userDoc = await retry(() => getDoc(userRef), 3, 1000);
      
      if (!userDoc.exists()) {
        return null;
      }
      
      const data = userDoc.data();
      return {
        uid: userId,
        email: data.email || '',
        displayName: data.displayName || '',
        photoURL: data.photoURL,
        phoneNumber: data.phoneNumber,
        department: data.department,
        position: data.position,
        bio: data.bio,
        preferences: {
          notifications: data.preferences?.notifications ?? true,
          emailUpdates: data.preferences?.emailUpdates ?? true,
          darkMode: data.preferences?.darkMode ?? false,
        },
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      };
    }, (error) => {
      const message = `取得用戶資料失敗: ${getErrorMessage(error)}`;
      logError(error, { operation: 'get_user_profile', userId });
      throw new Error(message);
    });
  }

  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    await safeAsync(async () => {
      const userRef = doc(db, 'members', userId);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      // 移除不需要的欄位
      delete updateData.uid;
      delete updateData.createdAt;
      
      await retry(() => updateDoc(userRef, updateData), 3, 1000);
    }, (error) => {
      const message = `更新用戶資料失敗: ${getErrorMessage(error)}`;
      logError(error, { operation: 'update_user_profile', userId, updates });
      throw new Error(message);
    });
  }

  static async updateUserPreferences(userId: string, preferences: Partial<UserProfile['preferences']>): Promise<void> {
    await safeAsync(async () => {
      const userRef = doc(db, 'members', userId);
      await retry(() => updateDoc(userRef, {
        preferences: preferences,
        updatedAt: new Date().toISOString(),
      }), 3, 1000);
    }, (error) => {
      const message = `更新用戶偏好設定失敗: ${getErrorMessage(error)}`;
      logError(error, { operation: 'update_user_preferences', userId, preferences });
      throw new Error(message);
    });
  }
}
