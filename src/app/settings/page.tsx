/**
 * 系統設定頁面
 *
 * 只有擁有者可以進入，提供以下功能：
 * - 建立和管理自訂角色
 * - 設定角色權限
 * - 查看系統狀態
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

import { Unauthorized } from '@/components/common/Unauthorized';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase-client';
import { ALL_PERMISSIONS, PERMISSION_CATEGORIES } from '@/constants/permissions';
import type { CustomRole } from '@/constants/roles';
import { getErrorMessage, logError, safeAsync, retry } from '@/utils/errorUtils';

interface RoleFormData {
  name: string;
  level: number;
  permissions: string[];
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading, hasPermission } = useAuth();
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    level: 1,
    permissions: [],
  });

  // 檢查是否有系統設定權限
  useEffect(() => {
    if (!loading && user) {
      if (!hasPermission('settings')) {
        router.push('/dashboard');
      }
    }
  }, [loading, user, router, hasPermission]);

  // 載入自訂角色
  useEffect(() => {
    const loadCustomRoles = async () => {
      setLoadingRoles(true);
      await safeAsync(async () => {
        const rolesSnapshot = await retry(() => getDocs(collection(db, 'customRoles')), 3, 1000);
        const roles: CustomRole[] = [];
        rolesSnapshot.forEach(doc => {
          roles.push({ id: doc.id, ...doc.data() } as CustomRole);
        });
        setCustomRoles(roles.sort((a, b) => a.level - b.level));
      }, (error) => {
        logError(error, { operation: 'load_custom_roles' });
      });
      setLoadingRoles(false);
    };

    if (user && hasPermission('settings')) {
      void loadCustomRoles();
    }
  }, [user, hasPermission]);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await safeAsync(async () => {
      const roleData = {
        name: formData.name,
        level: formData.level,
        permissions: formData.permissions,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
      };

      await retry(() => addDoc(collection(db, 'customRoles'), roleData), 3, 1000);
      
      // 重新載入角色列表
      const rolesSnapshot = await getDocs(collection(db, 'customRoles'));
      const roles: CustomRole[] = [];
      rolesSnapshot.forEach(doc => {
        roles.push({ id: doc.id, ...doc.data() } as CustomRole);
      });
      setCustomRoles(roles.sort((a, b) => a.level - b.level));
      
      // 重置表單
      setFormData({ name: '', level: 1, permissions: [] });
      setShowCreateForm(false);
    }, (error) => {
      alert(`建立角色失敗: ${getErrorMessage(error)}`);
      logError(error, { operation: 'create_custom_role' });
    });
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;

    await safeAsync(async () => {
      const roleRef = doc(db, 'customRoles', editingRole.id);
      await retry(() => updateDoc(roleRef, {
        name: formData.name,
        level: formData.level,
        permissions: formData.permissions,
        updatedAt: new Date().toISOString(),
      }), 3, 1000);

      // 重新載入角色列表
      const rolesSnapshot = await getDocs(collection(db, 'customRoles'));
      const roles: CustomRole[] = [];
      rolesSnapshot.forEach(doc => {
        roles.push({ id: doc.id, ...doc.data() } as CustomRole);
      });
      setCustomRoles(roles.sort((a, b) => a.level - b.level));

      // 重置表單
      setFormData({ name: '', level: 1, permissions: [] });
      setEditingRole(null);
    }, (error) => {
      alert(`更新角色失敗: ${getErrorMessage(error)}`);
      logError(error, { operation: 'update_custom_role' });
    });
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!window.confirm('確定要刪除此角色嗎？此操作無法復原。')) return;

    await safeAsync(async () => {
      await retry(() => deleteDoc(doc(db, 'customRoles', roleId)), 3, 1000);
      
      // 重新載入角色列表
      const rolesSnapshot = await getDocs(collection(db, 'customRoles'));
      const roles: CustomRole[] = [];
      rolesSnapshot.forEach(doc => {
        roles.push({ id: doc.id, ...doc.data() } as CustomRole);
      });
      setCustomRoles(roles.sort((a, b) => a.level - b.level));
    }, (error) => {
      alert(`刪除角色失敗: ${getErrorMessage(error)}`);
      logError(error, { operation: 'delete_custom_role' });
    });
  };

  const handleEditRole = (role: CustomRole) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      level: role.level,
      permissions: role.permissions,
    });
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter(p => p !== permissionId),
    }));
  };

  const handleCategoryToggle = (category: keyof typeof PERMISSION_CATEGORIES, checked: boolean) => {
    const categoryPermissions = PERMISSION_CATEGORIES[category];
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...new Set([...prev.permissions, ...categoryPermissions])]
        : prev.permissions.filter(p => !(categoryPermissions as readonly string[]).includes(p)),
    }));
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  if (!user || !hasPermission('settings')) {
    return <Unauthorized message='您沒有權限訪問系統設定' />;
  }

  return (
    <main className='max-w-6xl mx-auto p-6'>
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
        <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-6'>
          系統設定
        </h1>

        {/* 角色管理區塊 */}
        <div className='mb-8'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>自訂角色管理</h2>
            <button
              onClick={() => setShowCreateForm(true)}
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              建立新角色
            </button>
          </div>

          {/* 角色列表 */}
          {loadingRoles ? (
            <div className='flex justify-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
            </div>
          ) : (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {customRoles.map(role => (
                <div key={role.id} className='border border-gray-200 dark:border-gray-700 rounded-lg p-4'>
                  <div className='flex justify-between items-start mb-2'>
                    <h3 className='font-semibold text-gray-900 dark:text-white'>{role.name}</h3>
                    <span className='text-sm text-gray-500 dark:text-gray-400'>等級 {role.level}</span>
                  </div>
                  <p className='text-sm text-gray-600 dark:text-gray-300 mb-3'>
                    權限數量: {role.permissions.length}
                  </p>
                  <div className='flex gap-2'>
                    <button
                      onClick={() => handleEditRole(role)}
                      className='px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors'
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className='px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors'
                    >
                      刪除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 建立/編輯角色表單 */}
        {(showCreateForm || editingRole) && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto'>
              <h3 className='text-lg font-semibold mb-4 text-gray-900 dark:text-white'>
                {editingRole ? '編輯角色' : '建立新角色'}
              </h3>
              
              <form onSubmit={editingRole ? handleUpdateRole : handleCreateRole} className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                      角色名稱
                    </label>
                    <input
                      type='text'
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                      角色等級 (1-98)
                    </label>
                    <input
                      type='number'
                      min='1'
                      max='98'
                      value={formData.level}
                      onChange={e => setFormData(prev => ({ ...prev, level: parseInt(e.target.value) }))}
                      className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      required
                    />
                  </div>
                </div>

                {/* 權限設定 */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    權限設定
                  </label>
                  
                  {/* 權限分類快速選擇 */}
                  <div className='mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                    <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>快速選擇</h4>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
                      {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
                        <label key={category} className='flex items-center text-sm'>
                          <input
                            type='checkbox'
                            checked={permissions.every(p => formData.permissions.includes(p))}
                            onChange={e => handleCategoryToggle(category as keyof typeof PERMISSION_CATEGORIES, e.target.checked)}
                            className='mr-2'
                          />
                          {category === 'basic' && '基本權限'}
                          {category === 'planning' && '規劃管理'}
                          {category === 'projects' && '專案管理'}
                          {category === 'finance' && '財務管理'}
                          {category === 'archive' && '封存管理'}
                          {category === 'system' && '系統管理'}
                          {category === 'ai' && 'AI 功能'}
                          {category === 'notifications' && '通知管理'}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 詳細權限列表 */}
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
                    {ALL_PERMISSIONS.map(permission => (
                      <label key={permission.id} className='flex items-center text-sm'>
                        <input
                          type='checkbox'
                          checked={formData.permissions.includes(permission.id)}
                          onChange={e => handlePermissionChange(permission.id, e.target.checked)}
                          className='mr-2'
                        />
                        {permission.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div className='flex justify-end gap-3 pt-4'>
                  <button
                    type='button'
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingRole(null);
                      setFormData({ name: '', level: 1, permissions: [] });
                    }}
                    className='px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
                  >
                    取消
                  </button>
                  <button
                    type='submit'
                    className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                  >
                    {editingRole ? '更新角色' : '建立角色'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
