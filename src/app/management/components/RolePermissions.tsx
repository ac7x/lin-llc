'use client';

import { useState, useEffect } from 'react';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { type RoleKey, ROLE_NAMES } from '@/constants/roles';
import { PAGE_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from '@/constants/permissions';

interface RolePermissionData {
  role: RoleKey;
  pagePermissions: Array<{ id: string; name: string; description: string; path: string }>;
  updatedAt: string;
}

export default function RolePermissions(): React.ReactElement {
  const [selectedRole, setSelectedRole] = useState<RoleKey>('guest');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [rolePermissions, setRolePermissions] = useState<Record<RoleKey, string[]>>({} as Record<RoleKey, string[]>);

  useEffect(() => {
    const fetchRolePermissions = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const managementRef = collection(db, 'management');
        const snapshot = await getDocs(managementRef);
        
        const newPermissions: Record<RoleKey, string[]> = {} as Record<RoleKey, string[]>;
        for (const role in DEFAULT_ROLE_PERMISSIONS) {
          newPermissions[role as RoleKey] = [...DEFAULT_ROLE_PERMISSIONS[role as RoleKey]];
        }

        snapshot.docs.forEach((doc) => {
          const data = doc.data() as RolePermissionData;
          if (data.role && data.pagePermissions) {
            newPermissions[data.role] = data.pagePermissions.map(p => p.id);
          }
        });
        setRolePermissions(newPermissions);
      } catch (error) {
        console.error('載入角色權限失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchRolePermissions();
  }, []);

  const handlePermissionChange = (permissionId: string, checked: boolean): void => {
    const currentPermissions = rolePermissions[selectedRole] || [];
    let newPermissions: string[];

    if (checked) {
      newPermissions = [...currentPermissions, permissionId];
    } else {
      newPermissions = currentPermissions.filter(p => p !== permissionId);
    }
    
    setRolePermissions(prev => ({ ...prev, [selectedRole]: newPermissions }));
  };
  
  const handleArchiveToggle = (checked: boolean): void => {
    const currentPermissions = rolePermissions[selectedRole] || [];
    let newPermissions: string[];
    
    if (checked) {
      newPermissions = [...currentPermissions, 'archive'];
    } else {
      newPermissions = currentPermissions.filter(p => !p.startsWith('archive'));
    }

    setRolePermissions(prev => ({
      ...prev,
      [selectedRole]: newPermissions,
    }));
  };

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    try {
      const permissionsToSave = (rolePermissions[selectedRole] || []).map(id => {
        return PAGE_PERMISSIONS.find(p => p.id === id) || { id, name: id, description: '', path: '' };
      }).filter(p => p.id);

      const roleDocRef = doc(db, 'management', selectedRole);
      await setDoc(roleDocRef, {
        role: selectedRole,
        pagePermissions: permissionsToSave,
        updatedAt: new Date().toISOString(),
      });
      alert('權限已儲存');
    } catch (error) {
      console.error('儲存權限失敗:', error);
      alert('儲存失敗');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-gray-700 dark:text-gray-300">正在載入權限設定...</span>
      </div>
    );
  }

  const isArchiveEnabled = rolePermissions[selectedRole]?.includes('archive') ?? false;
  const archivePermissions = PAGE_PERMISSIONS.filter(p => p.id.startsWith('archive-') && p.id !== 'archive');
  const nonArchivePermissions = PAGE_PERMISSIONS.filter(p => !p.id.startsWith('archive-'));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">角色權限管理</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as RoleKey)}
            className="form-select block w-48 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            disabled={isSaving}
          >
            {Object.entries(ROLE_NAMES).map(([key, name]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            {isSaving ? '儲存中...' : '儲存變更'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
        {nonArchivePermissions.map((permission) => (
          <div key={permission.id} className="flex items-center">
            <input
              type="checkbox"
              id={`perm-${permission.id}`}
              className="form-checkbox h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-offset-gray-800"
              checked={rolePermissions[selectedRole]?.includes(permission.id) ?? false}
              onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
              disabled={isSaving}
            />
            <label htmlFor={`perm-${permission.id}`} className="ml-3 text-gray-700 dark:text-gray-300 select-none">
              {permission.name}
            </label>
          </div>
        ))}
        
        <div className="col-span-full border-t border-gray-200 dark:border-gray-700 my-4"></div>
        
        <div className="col-span-full">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="perm-archive"
              className="form-checkbox h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-offset-gray-800"
              checked={isArchiveEnabled}
              onChange={(e) => handleArchiveToggle(e.target.checked)}
              disabled={isSaving}
            />
            <label htmlFor="perm-archive" className="ml-3 font-semibold text-gray-800 dark:text-gray-200 select-none">
              啟用封存功能
            </label>
          </div>
        </div>

        {isArchiveEnabled && archivePermissions.map((permission) => (
          <div key={permission.id} className="flex items-center ml-8">
            <input
              type="checkbox"
              id={`perm-${permission.id}`}
              className="form-checkbox h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-offset-gray-800"
              checked={rolePermissions[selectedRole]?.includes(permission.id) ?? false}
              onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
              disabled={isSaving}
            />
            <label htmlFor={`perm-${permission.id}`} className="ml-3 text-gray-700 dark:text-gray-300 select-none">
              {permission.name}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
} 