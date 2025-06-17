'use client';

import { useState, useEffect } from 'react';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { type RoleKey, ROLE_NAMES } from '@/constants/roles';
import type { AppUser } from '@/types/user';

interface RolePermissionsProps {
  user: AppUser;
  onUpdate: () => Promise<void>;
}

interface PagePermission {
  id: string;
  name: string;
  description: string;
  path: string;
}

interface RolePermissionData {
  role: RoleKey;
  pagePermissions: PagePermission[];
  updatedAt: string;
}

export const PAGE_PERMISSIONS = [
  // 基本權限
  {
    id: 'dashboard',
    name: '儀表板',
    description: '查看儀表板',
    path: '/dashboard',
  },
  {
    id: 'profile',
    name: '個人資料',
    description: '管理個人資料',
    path: '/profile',
  },
  // 封存功能
  {
    id: 'archive',
    name: '封存功能',
    description: '封存功能開關',
    path: '/archive',
  },
  {
    id: 'archive-orders',
    name: '封存訂單',
    description: '查看和管理封存訂單',
    path: '/archive/orders',
  },
  {
    id: 'archive-quotes',
    name: '封存估價單',
    description: '查看和管理封存估價單',
    path: '/archive/quotes',
  },
  {
    id: 'archive-contracts',
    name: '封存合約',
    description: '查看和管理封存合約',
    path: '/archive/contracts',
  },
  {
    id: 'archive-projects',
    name: '封存專案',
    description: '查看和管理封存專案',
    path: '/archive/projects',
  },
  {
    id: 'projects',
    name: '專案管理',
    description: '管理專案相關功能',
    path: '/projects',
  },
  {
    id: 'schedule',
    name: '排程管理',
    description: '管理排程相關功能',
    path: '/schedule',
  },
  {
    id: 'orders',
    name: '訂單管理',
    description: '管理訂單相關功能',
    path: '/orders',
  },
  {
    id: 'quotes',
    name: '報價管理',
    description: '管理報價相關功能',
    path: '/quotes',
  },
  {
    id: 'contracts',
    name: '合約管理',
    description: '管理合約相關功能',
    path: '/contracts',
  },
  {
    id: 'notifications',
    name: '通知管理',
    description: '管理通知相關功能',
    path: '/notifications',
  },
  {
    id: 'send-notification',
    name: '發送通知',
    description: '發送系統通知',
    path: '/send-notification',
  },
  {
    id: 'management',
    name: '系統管理',
    description: '管理系統設置和權限',
    path: '/management',
  },
] as const;

export const DEFAULT_ROLE_PERMISSIONS: Record<RoleKey, string[]> = {
  guest: ['dashboard', 'profile'],
  temporary: ['dashboard', 'schedule', 'profile'],
  helper: ['dashboard', 'schedule', 'orders', 'profile'],
  user: ['dashboard', 'schedule', 'orders', 'quotes', 'profile'],
  coord: ['dashboard', 'schedule', 'orders', 'quotes', 'contracts', 'profile'],
  safety: ['dashboard', 'schedule', 'orders', 'quotes', 'contracts', 'profile'],
  foreman: ['dashboard', 'schedule', 'orders', 'quotes', 'contracts', 'profile'],
  vendor: ['dashboard', 'schedule', 'orders', 'quotes', 'contracts', 'profile'],
  finance: ['dashboard', 'orders', 'quotes', 'contracts', 'profile'],
  manager: [
    'dashboard',
    'profile',
    'archive',
    'archive-orders',
    'archive-quotes',
    'archive-contracts',
    'archive-projects',
    'projects',
    'schedule',
    'orders',
    'quotes',
    'contracts',
    'notifications',
    'send-notification',
    'management'
  ],
  admin: [
    'dashboard',
    'profile',
    'archive',
    'archive-orders',
    'archive-quotes',
    'archive-contracts',
    'archive-projects',
    'projects',
    'schedule',
    'orders',
    'quotes',
    'contracts',
    'notifications',
    'send-notification',
    'management'
  ],
  owner: [
    'dashboard',
    'profile',
    'archive',
    'archive-orders',
    'archive-quotes',
    'archive-contracts',
    'archive-projects',
    'projects',
    'schedule',
    'orders',
    'quotes',
    'contracts',
    'notifications',
    'send-notification',
    'management'
  ],
};

export default function RolePermissions({ onUpdate }: RolePermissionsProps): React.ReactElement {
  const [selectedRole, setSelectedRole] = useState<RoleKey>('guest');
  const [loading, setLoading] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<Record<RoleKey, string[]>>(DEFAULT_ROLE_PERMISSIONS);

  // 檢查是否啟用封存功能
  const isArchiveEnabled = rolePermissions[selectedRole].includes('archive');

  // 獲取封存相關的權限
  const archivePermissions = PAGE_PERMISSIONS.filter(p => 
    p.id.startsWith('archive-') && p.id !== 'archive'
  );

  // 獲取非封存相關的權限
  const nonArchivePermissions = PAGE_PERMISSIONS.filter(p => 
    !p.id.startsWith('archive-')
  );

  useEffect(() => {
    const fetchRolePermissions = async (): Promise<void> => {
      try {
        const managementRef = collection(db, 'management');
        const snapshot = await getDocs(managementRef);
        const permissions: Record<RoleKey, string[]> = { ...DEFAULT_ROLE_PERMISSIONS };

        snapshot.docs.forEach((doc) => {
          const data = doc.data() as RolePermissionData;
          if (data.role && data.pagePermissions) {
            permissions[data.role] = data.pagePermissions.map(p => p.id);
          }
        });

        setRolePermissions(permissions);
      } catch (error) {
        console.error('載入角色權限失敗:', error);
      }
    };

    void fetchRolePermissions();
  }, []);

  const handlePermissionChange = async (permissionId: string, checked: boolean): Promise<void> => {
    try {
      setLoading(true);
      let newPermissions = checked
        ? [...rolePermissions[selectedRole], permissionId]
        : rolePermissions[selectedRole].filter(id => id !== permissionId);

      // 如果關閉封存功能，同時移除所有封存相關的權限
      if (permissionId === 'archive' && !checked) {
        newPermissions = newPermissions.filter(id => !id.startsWith('archive-'));
      }

      // 更新角色權限配置
      const rolePermissionsRef = doc(db, 'management', selectedRole);
      await setDoc(rolePermissionsRef, {
        role: selectedRole,
        pagePermissions: PAGE_PERMISSIONS.filter(p => newPermissions.includes(p.id)),
        updatedAt: new Date().toISOString(),
      });

      setRolePermissions(prev => ({
        ...prev,
        [selectedRole]: newPermissions,
      }));

      await onUpdate();
    } catch (error) {
      console.error('更新權限失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          選擇角色
        </label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as RoleKey)}
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
        >
          {Object.entries(ROLE_NAMES).map(([key, name]) => (
            <option key={key} value={key}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {ROLE_NAMES[selectedRole]} 角色權限設置
        </h3>
        <div className="grid gap-4">
          {/* 非封存相關的權限 */}
          {nonArchivePermissions.map((permission) => (
            <div
              key={permission.id}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between"
            >
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {permission.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {permission.description}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={rolePermissions[selectedRole].includes(permission.id)}
                  onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                  disabled={loading}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          ))}

          {/* 封存功能開關 */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                封存功能
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                啟用/停用封存功能
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isArchiveEnabled}
                onChange={(e) => handlePermissionChange('archive', e.target.checked)}
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* 封存相關的原子權限（只在封存功能開啟時顯示） */}
          {isArchiveEnabled && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                封存權限設置
              </h4>
              {archivePermissions.map((permission) => (
                <div
                  key={permission.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {permission.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {permission.description}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      checked={rolePermissions[selectedRole].includes(permission.id)}
                      onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                      disabled={loading}
                    />
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 