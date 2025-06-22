import { doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase-client';
import { safeAsync, retry, getErrorMessage, logError } from '@/utils/errorUtils';
import type { Project } from '../types';
import { useAuth } from '@/hooks/useAuth';
import { ProfileService, type UserProfile } from '../services/profileService';
import { validateProfileData, getDefaultPreferences } from '../utils/profileUtils';

export function useProjectActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    setIsLoading(true);
    setError(null);

    await safeAsync(async () => {
      const projectRef = doc(db, 'projects', projectId);
      await retry(() => updateDoc(projectRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      }), 3, 1000);
    }, (error) => {
      const message = `更新專案失敗: ${getErrorMessage(error)}`;
      setError(message);
      logError(error, { operation: 'update_project', projectId });
      throw new Error(message);
    });

    setIsLoading(false);
  };

  const deleteProject = async (projectId: string) => {
    setIsLoading(true);
    setError(null);

    await safeAsync(async () => {
      const projectRef = doc(db, 'projects', projectId);
      await retry(() => deleteDoc(projectRef), 3, 1000);
    }, (error) => {
      const message = `刪除專案失敗: ${getErrorMessage(error)}`;
      setError(message);
      logError(error, { operation: 'delete_project', projectId });
      throw new Error(message);
    });

    setIsLoading(false);
  };

  const archiveProject = async (projectId: string) => {
    setIsLoading(true);
    setError(null);

    await safeAsync(async () => {
      const projectRef = doc(db, 'projects', projectId);
      await retry(() => updateDoc(projectRef, {
        status: 'archived',
        archivedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }), 3, 1000);
    }, (error) => {
      const message = `封存專案失敗: ${getErrorMessage(error)}`;
      setError(message);
      logError(error, { operation: 'archive_project', projectId });
      throw new Error(message);
    });

    setIsLoading(false);
  };

  return {
    updateProject,
    deleteProject,
    archiveProject,
    isLoading,
    error,
  };
}

export function useProjectProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 載入用戶資料
  const loadProfile = useCallback(async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const userProfile = await ProfileService.getUserProfile(user.uid);
      if (userProfile) {
        setProfile(userProfile);
      } else {
        // 如果沒有資料，建立預設資料
        const defaultProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || undefined,
          preferences: getDefaultPreferences(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setProfile(defaultProfile);
      }
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      logError(err, { operation: 'load_profile', userId: user.uid });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 更新用戶資料
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user?.uid || !profile) return;
    
    // 驗證資料
    const validationErrors = validateProfileData(updates);
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await ProfileService.updateUserProfile(user.uid, updates);
      setProfile(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
      setIsEditing(false);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      logError(err, { operation: 'update_profile', userId: user.uid, updates });
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  // 更新偏好設定
  const updatePreferences = useCallback(async (preferences: Partial<UserProfile['preferences']>) => {
    if (!user?.uid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await ProfileService.updateUserPreferences(user.uid, preferences);
      setProfile(prev => prev ? {
        ...prev,
        preferences: { 
          notifications: prev.preferences?.notifications ?? true,
          emailUpdates: prev.preferences?.emailUpdates ?? true,
          darkMode: prev.preferences?.darkMode ?? false,
          ...preferences 
        },
        updatedAt: new Date()
      } : null);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      logError(err, { operation: 'update_preferences', userId: user.uid, preferences });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 開始編輯
  const startEditing = useCallback(() => {
    setIsEditing(true);
    setError(null);
  }, []);

  // 取消編輯
  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setError(null);
  }, []);

  // 儲存編輯
  const saveProfile = useCallback(async (updates: Partial<UserProfile>) => {
    await updateProfile(updates);
  }, [updateProfile]);

  // 初始化載入
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    loading,
    error,
    isEditing,
    loadProfile,
    updateProfile,
    updatePreferences,
    startEditing,
    cancelEditing,
    saveProfile,
  };
} 