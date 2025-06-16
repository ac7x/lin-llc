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

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface RolePermissionData {
  role: RoleKey;
  permissions: Permission[];
  updatedAt: string;
}

const ROLE_PERMISSIONS: Record<RoleKey, Permission[]> = {
  guest: [
    { id: 'view_public', name: '查看公開資訊', description: '可以查看公開的專案資訊' },
  ],
  temporary: [
    { id: 'view_public', name: '查看公開資訊', description: '可以查看公開的專案資訊' },
    { id: 'view_own_tasks', name: '查看個人任務', description: '可以查看分配給自己的任務' },
  ],
  helper: [
    { id: 'view_public', name: '查看公開資訊', description: '可以查看公開的專案資訊' },
    { id: 'view_own_tasks', name: '查看個人任務', description: '可以查看分配給自己的任務' },
    { id: 'create_tasks', name: '創建任務', description: '可以創建新的任務' },
  ],
  user: [
    { id: 'view_public', name: '查看公開資訊', description: '可以查看公開的專案資訊' },
    { id: 'view_own_tasks', name: '查看個人任務', description: '可以查看分配給自己的任務' },
    { id: 'create_tasks', name: '創建任務', description: '可以創建新的任務' },
    { id: 'edit_own_tasks', name: '編輯個人任務', description: '可以編輯自己的任務' },
  ],
  coord: [
    { id: 'view_public', name: '查看公開資訊', description: '可以查看公開的專案資訊' },
    { id: 'view_own_tasks', name: '查看個人任務', description: '可以查看分配給自己的任務' },
    { id: 'create_tasks', name: '創建任務', description: '可以創建新的任務' },
    { id: 'edit_own_tasks', name: '編輯個人任務', description: '可以編輯自己的任務' },
    { id: 'assign_tasks', name: '分配任務', description: '可以分配任務給其他用戶' },
  ],
  safety: [
    { id: 'view_public', name: '查看公開資訊', description: '可以查看公開的專案資訊' },
    { id: 'view_own_tasks', name: '查看個人任務', description: '可以查看分配給自己的任務' },
    { id: 'create_tasks', name: '創建任務', description: '可以創建新的任務' },
    { id: 'edit_own_tasks', name: '編輯個人任務', description: '可以編輯自己的任務' },
    { id: 'assign_tasks', name: '分配任務', description: '可以分配任務給其他用戶' },
    { id: 'manage_safety', name: '管理安全事項', description: '可以管理安全相關的事項' },
  ],
  foreman: [
    { id: 'view_public', name: '查看公開資訊', description: '可以查看公開的專案資訊' },
    { id: 'view_own_tasks', name: '查看個人任務', description: '可以查看分配給自己的任務' },
    { id: 'create_tasks', name: '創建任務', description: '可以創建新的任務' },
    { id: 'edit_own_tasks', name: '編輯個人任務', description: '可以編輯自己的任務' },
    { id: 'assign_tasks', name: '分配任務', description: '可以分配任務給其他用戶' },
    { id: 'manage_safety', name: '管理安全事項', description: '可以管理安全相關的事項' },
    { id: 'manage_workers', name: '管理工人', description: '可以管理工人相關事項' },
  ],
  vendor: [
    { id: 'view_public', name: '查看公開資訊', description: '可以查看公開的專案資訊' },
    { id: 'view_own_tasks', name: '查看個人任務', description: '可以查看分配給自己的任務' },
    { id: 'create_tasks', name: '創建任務', description: '可以創建新的任務' },
    { id: 'edit_own_tasks', name: '編輯個人任務', description: '可以編輯自己的任務' },
    { id: 'manage_inventory', name: '管理庫存', description: '可以管理庫存相關事項' },
  ],
  finance: [
    { id: 'view_public', name: '查看公開資訊', description: '可以查看公開的專案資訊' },
    { id: 'view_own_tasks', name: '查看個人任務', description: '可以查看分配給自己的任務' },
    { id: 'create_tasks', name: '創建任務', description: '可以創建新的任務' },
    { id: 'edit_own_tasks', name: '編輯個人任務', description: '可以編輯自己的任務' },
    { id: 'manage_finance', name: '管理財務', description: '可以管理財務相關事項' },
  ],
  manager: [
    { id: 'view_public', name: '查看公開資訊', description: '可以查看公開的專案資訊' },
    { id: 'view_own_tasks', name: '查看個人任務', description: '可以查看分配給自己的任務' },
    { id: 'create_tasks', name: '創建任務', description: '可以創建新的任務' },
    { id: 'edit_own_tasks', name: '編輯個人任務', description: '可以編輯自己的任務' },
    { id: 'assign_tasks', name: '分配任務', description: '可以分配任務給其他用戶' },
    { id: 'manage_safety', name: '管理安全事項', description: '可以管理安全相關的事項' },
    { id: 'manage_workers', name: '管理工人', description: '可以管理工人相關事項' },
    { id: 'manage_projects', name: '管理專案', description: '可以管理專案相關事項' },
  ],
  admin: [
    { id: 'view_public', name: '查看公開資訊', description: '可以查看公開的專案資訊' },
    { id: 'view_own_tasks', name: '查看個人任務', description: '可以查看分配給自己的任務' },
    { id: 'create_tasks', name: '創建任務', description: '可以創建新的任務' },
    { id: 'edit_own_tasks', name: '編輯個人任務', description: '可以編輯自己的任務' },
    { id: 'assign_tasks', name: '分配任務', description: '可以分配任務給其他用戶' },
    { id: 'manage_safety', name: '管理安全事項', description: '可以管理安全相關的事項' },
    { id: 'manage_workers', name: '管理工人', description: '可以管理工人相關事項' },
    { id: 'manage_projects', name: '管理專案', description: '可以管理專案相關事項' },
    { id: 'manage_users', name: '管理用戶', description: '可以管理所有用戶' },
    { id: 'manage_roles', name: '管理角色', description: '可以管理角色權限' },
  ],
  owner: [
    { id: 'view_public', name: '查看公開資訊', description: '可以查看公開的專案資訊' },
    { id: 'view_own_tasks', name: '查看個人任務', description: '可以查看分配給自己的任務' },
    { id: 'create_tasks', name: '創建任務', description: '可以創建新的任務' },
    { id: 'edit_own_tasks', name: '編輯個人任務', description: '可以編輯自己的任務' },
    { id: 'assign_tasks', name: '分配任務', description: '可以分配任務給其他用戶' },
    { id: 'manage_safety', name: '管理安全事項', description: '可以管理安全相關的事項' },
    { id: 'manage_workers', name: '管理工人', description: '可以管理工人相關事項' },
    { id: 'manage_projects', name: '管理專案', description: '可以管理專案相關事項' },
    { id: 'manage_users', name: '管理用戶', description: '可以管理所有用戶' },
    { id: 'manage_roles', name: '管理角色', description: '可以管理角色權限' },
    { id: 'manage_system', name: '管理系統', description: '可以管理系統設置' },
  ],
};

export default function RolePermissions({ user, onUpdate }: RolePermissionsProps): React.ReactElement {
  const [selectedRole, setSelectedRole] = useState<RoleKey>((user.roles?.[0] as RoleKey) || 'guest');
  const [loading, setLoading] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<Record<RoleKey, Permission[]>>(ROLE_PERMISSIONS);

  useEffect(() => {
    const fetchRolePermissions = async (): Promise<void> => {
      try {
        const managementRef = collection(db, 'management');
        const snapshot = await getDocs(managementRef);
        const permissions: Record<RoleKey, Permission[]> = { ...ROLE_PERMISSIONS };

        snapshot.docs.forEach((doc) => {
          const data = doc.data() as RolePermissionData;
          if (data.role && data.permissions) {
            permissions[data.role] = data.permissions;
          }
        });

        setRolePermissions(permissions);
      } catch (error) {
        console.error('載入角色權限失敗:', error);
      }
    };

    void fetchRolePermissions();
  }, []);

  const handleRoleChange = async (role: RoleKey): Promise<void> => {
    try {
      setLoading(true);
      const userRef = doc(db, 'members', user.uid);
      const rolePermissionsRef = doc(db, 'management', role);

      // 更新用戶角色
      await updateDoc(userRef, {
        roles: [role],
        permissions: rolePermissions[role].map(p => p.id),
        updatedAt: new Date().toISOString(),
      });

      // 更新角色權限
      await setDoc(rolePermissionsRef, {
        role,
        permissions: rolePermissions[role],
        updatedAt: new Date().toISOString(),
      });

      setSelectedRole(role);
      await onUpdate();
    } catch (error) {
      console.error('更新角色失敗:', error);
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
          onChange={(e) => handleRoleChange(e.target.value as RoleKey)}
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
          {ROLE_NAMES[selectedRole]} 權限列表
        </h3>
        <div className="grid gap-4">
          {rolePermissions[selectedRole].map((permission) => (
            <div
              key={permission.id}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <h4 className="font-medium text-gray-900 dark:text-white">
                {permission.name}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {permission.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 