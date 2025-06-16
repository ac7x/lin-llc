'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, collection, getDocs, setDoc } from 'firebase/firestore';
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

const PAGE_PERMISSIONS: PagePermission[] = [
  {
    id: 'dashboard',
    name: '儀表板',
    description: '查看系統儀表板',
    path: '/dashboard',
  },
  {
    id: 'projects',
    name: '專案管理',
    description: '管理專案相關功能',
    path: '/projects',
  },
  {
    id: 'tasks',
    name: '任務管理',
    description: '管理任務相關功能',
    path: '/tasks',
  },
  {
    id: 'safety',
    name: '安全管理',
    description: '管理安全相關功能',
    path: '/safety',
  },
  {
    id: 'finance',
    name: '財務管理',
    description: '管理財務相關功能',
    path: '/finance',
  },
  {
    id: 'inventory',
    name: '庫存管理',
    description: '管理庫存相關功能',
    path: '/inventory',
  },
  {
    id: 'workers',
    name: '工人管理',
    description: '管理工人相關功能',
    path: '/workers',
  },
  {
    id: 'reports',
    name: '報表管理',
    description: '查看和管理報表',
    path: '/reports',
  },
  {
    id: 'settings',
    name: '系統設置',
    description: '管理系統設置',
    path: '/settings',
  },
];

const DEFAULT_ROLE_PERMISSIONS: Record<RoleKey, string[]> = {
  guest: ['dashboard'],
  temporary: ['dashboard', 'tasks'],
  helper: ['dashboard', 'tasks', 'inventory'],
  user: ['dashboard', 'tasks', 'inventory', 'reports'],
  coord: ['dashboard', 'tasks', 'inventory', 'reports', 'workers'],
  safety: ['dashboard', 'tasks', 'safety', 'reports'],
  foreman: ['dashboard', 'tasks', 'safety', 'workers', 'inventory'],
  vendor: ['dashboard', 'tasks', 'inventory'],
  finance: ['dashboard', 'finance', 'reports'],
  manager: ['dashboard', 'projects', 'tasks', 'safety', 'workers', 'reports'],
  admin: ['dashboard', 'projects', 'tasks', 'safety', 'finance', 'inventory', 'workers', 'reports', 'settings'],
  owner: ['dashboard', 'projects', 'tasks', 'safety', 'finance', 'inventory', 'workers', 'reports', 'settings'],
};

export default function RolePermissions({ user, onUpdate }: RolePermissionsProps): React.ReactElement {
  const [selectedRole, setSelectedRole] = useState<RoleKey>((user.roles?.[0] as RoleKey) || 'guest');
  const [loading, setLoading] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<Record<RoleKey, string[]>>(DEFAULT_ROLE_PERMISSIONS);
  const [activeTab, setActiveTab] = useState<string>('page');

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
      const currentPermissions = rolePermissions[selectedRole];
      const newPermissions = checked
        ? [...currentPermissions, permissionId]
        : currentPermissions.filter(id => id !== permissionId);

      const userRef = doc(db, 'members', user.uid);
      const rolePermissionsRef = doc(db, 'management', selectedRole);

      // 更新用戶權限
      await updateDoc(userRef, {
        permissions: newPermissions,
        updatedAt: new Date().toISOString(),
      });

      // 更新角色權限配置
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
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">角色權限設置</h2>
      
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

      <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('page')}
            className={`${
              activeTab === 'page'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            頁面權限
          </button>
        </nav>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {ROLE_NAMES[selectedRole]} 頁面權限設置
        </h3>
        <div className="grid gap-4">
          {PAGE_PERMISSIONS.map((permission) => (
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
        </div>
      </div>
    </div>
  );
} 