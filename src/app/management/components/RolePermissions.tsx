'use client';

import { useState, useEffect, ReactElement } from 'react';

import { ALL_PERMISSIONS, ROLE_PERMISSIONS, type PermissionId } from '@/constants/permissions';
import { type RoleKey, ROLE_NAMES } from '@/constants/roles';
import { logError, safeAsync } from '@/utils/errorUtils';

export default function RolePermissionsComponent(): ReactElement {
  const [selectedRole, setSelectedRole] = useState<RoleKey>('guest');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionSettings, setPermissionSettings] = useState<Record<RoleKey, PermissionId[]>>(
    {} as Record<RoleKey, PermissionId[]>
  );

  useEffect(() => {
    const loadPermissionSettings = async () => {
      setIsLoading(true);
      await safeAsync(async () => {
        // 載入預設角色權限
        setPermissionSettings(ROLE_PERMISSIONS);
        setIsLoading(false);
      }, (error) => {
        logError(error, { operation: 'load_permission_settings' });
        setIsLoading(false);
      });
    };

    void loadPermissionSettings();
  }, []);

  const handlePermissionToggle = (permissionId: PermissionId) => {
    setPermissionSettings(prev => {
      const currentPermissions = prev[selectedRole] || [];
      const newPermissions = currentPermissions.includes(permissionId)
        ? currentPermissions.filter(p => p !== permissionId)
        : [...currentPermissions, permissionId];
      
      return {
        ...prev,
        [selectedRole]: newPermissions,
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await safeAsync(async () => {
      // 這裡可以實作儲存到 Firestore 的邏輯
      // 目前只是更新本地狀態
      console.log('Saving permission settings:', permissionSettings);
      setIsSaving(false);
    }, (error) => {
      logError(error, { operation: 'save_permission_settings' });
      setIsSaving(false);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">載入中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          角色權限管理
        </h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? '儲存中...' : '儲存變更'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 角色選擇 */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            選擇角色
          </h3>
          <div className="space-y-2">
            {Object.keys(ROLE_NAMES).map((roleKey) => (
              <button
                key={roleKey}
                onClick={() => setSelectedRole(roleKey as RoleKey)}
                className={`w-full text-left p-3 rounded-md transition-colors ${
                  selectedRole === roleKey
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="font-medium">{ROLE_NAMES[roleKey as RoleKey]}</div>
                <div className="text-sm opacity-75">
                  {permissionSettings[roleKey as RoleKey]?.length || 0} 個權限
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 權限列表 */}
        <div className="lg:col-span-3">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {ROLE_NAMES[selectedRole]} 權限設定
          </h3>
          <div className="space-y-4">
            {ALL_PERMISSIONS.map((permission) => (
              <div
                key={permission.id}
                className="flex items-start space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <input
                  type="checkbox"
                  id={permission.id}
                  checked={permissionSettings[selectedRole]?.includes(permission.id) || false}
                  onChange={() => handlePermissionToggle(permission.id)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label
                    htmlFor={permission.id}
                    className="block text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                  >
                    {permission.name}
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {permission.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 