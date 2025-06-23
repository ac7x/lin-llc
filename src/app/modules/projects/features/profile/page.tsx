/**
 * 個人資料頁面
 * 
 * 提供用戶個人資料管理功能，包含：
 * - 個人資訊編輯
 * - 帳號設定
 * - 通知偏好設定
 * - 權限查看
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useProjectProfile } from '../../hooks/useProjectProfile';
import { getRoleDisplayName, formatDate } from '../../utils/profileUtils';
import { LoadingSpinner, PageContainer, PageHeader } from '../../components/common';
import { projectStyles } from '../../styles';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const {
    profile,
    loading: profileLoading,
    error,
    isEditing,
    startEditing,
    cancelEditing,
    saveProfile,
    updatePreferences,
  } = useProjectProfile();

  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    department: '',
    position: '',
    bio: '',
  });

  // 初始化表單資料
  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName,
        phoneNumber: profile.phoneNumber || '',
        department: profile.department || '',
        position: profile.position || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await saveProfile(formData);
  };

  const handlePreferenceChange = (key: string, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  if (authLoading || profileLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center min-h-64">
          <LoadingSpinner size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            需要登入
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            請先登入以查看個人資料
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="個人資料" 
        subtitle="管理您的個人資訊和帳號設定"
      >
        {!isEditing ? (
          <button
            onClick={startEditing}
            className={projectStyles.button.primary}
          >
            編輯資料
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className={projectStyles.button.primary}
            >
              儲存
            </button>
            <button
              onClick={cancelEditing}
              className={projectStyles.button.outline}
            >
              取消
            </button>
          </div>
        )}
      </PageHeader>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 個人資訊卡片 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本資訊 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              基本資訊
            </h3>
            
            <div className="flex items-center space-x-6 mb-6">
              <div className="relative group">
                <Image
                  src={user.photoURL || '/images/default-avatar.png'}
                  alt="使用者頭像"
                  className="h-24 w-24 rounded-full ring-4 ring-blue-100 dark:ring-blue-900 transition-all duration-300 group-hover:ring-blue-300 dark:group-hover:ring-blue-700 group-hover:scale-105"
                  width={96}
                  height={96}
                  priority
                />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {user.displayName}
                </p>
                <p className="text-gray-600 dark:text-gray-300">{user.email}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">UID: {user.uid}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 dark:from-blue-900 dark:to-blue-800 dark:text-blue-200">
                    {getRoleDisplayName(user.currentRole || 'user')}
                  </span>
                </div>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    顯示名稱
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    電話號碼
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      部門
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      職位
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    個人簡介
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="請簡短介紹自己..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      顯示名稱
                    </label>
                    <p className="text-gray-900 dark:text-gray-100">{profile?.displayName || '未設定'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      電話號碼
                    </label>
                    <p className="text-gray-900 dark:text-gray-100">{profile?.phoneNumber || '未設定'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      部門
                    </label>
                    <p className="text-gray-900 dark:text-gray-100">{profile?.department || '未設定'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      職位
                    </label>
                    <p className="text-gray-900 dark:text-gray-100">{profile?.position || '未設定'}</p>
                  </div>
                </div>
                
                {profile?.bio && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      個人簡介
                    </label>
                    <p className="text-gray-900 dark:text-gray-100">{profile.bio}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 帳號資訊 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              帳號資訊
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    電子郵件
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    帳號建立時間
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {profile?.createdAt ? formatDate(profile.createdAt) : '未知'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    最後更新時間
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {profile?.updatedAt ? formatDate(profile.updatedAt) : '未知'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    目前角色
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {getRoleDisplayName(user.currentRole || 'user')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 側邊欄 */}
        <div className="space-y-6">
          {/* 偏好設定 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              偏好設定
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    通知
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    接收系統通知
                  </p>
                </div>
                <button
                  onClick={() => handlePreferenceChange('notifications', !profile?.preferences?.notifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    profile?.preferences?.notifications
                      ? 'bg-blue-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      profile?.preferences?.notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    電子郵件更新
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    接收電子郵件通知
                  </p>
                </div>
                <button
                  onClick={() => handlePreferenceChange('emailUpdates', !profile?.preferences?.emailUpdates)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    profile?.preferences?.emailUpdates
                      ? 'bg-blue-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      profile?.preferences?.emailUpdates ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    深色模式
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    使用深色主題
                  </p>
                </div>
                <button
                  onClick={() => handlePreferenceChange('darkMode', !profile?.preferences?.darkMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    profile?.preferences?.darkMode
                      ? 'bg-blue-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      profile?.preferences?.darkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* 快速操作 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              快速操作
            </h3>
            
            <div className="space-y-3">
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors">
                變更密碼
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors">
                下載個人資料
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors">
                刪除帳號
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
