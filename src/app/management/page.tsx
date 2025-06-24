/**
 * 用戶管理頁面
 *
 * 提供用戶角色管理功能，包含：
 * - 查看所有用戶
 * - 修改用戶角色
 * - 用戶狀態管理
 */

'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase-client';
import { ROLE_NAMES, type RoleKey, type CustomRole } from '@/constants/roles';
import { getErrorMessage, logError, safeAsync, retry } from '@/utils/errorUtils';
import type { AppUser } from '@/types/auth';

interface UserWithRole extends Omit<AppUser, 'currentRole'> {
  roleDisplayName: string;
  isCustomRole: boolean;
  currentRole: string; // 支援自訂角色ID
}

export default function ManagementPage() {
  const { loading } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  // 載入用戶和自訂角色
  useEffect(() => {
    const loadData = async () => {
      setLoadingUsers(true);
      await safeAsync(async () => {
        // 載入自訂角色
        const rolesSnapshot = await retry(() => getDocs(collection(db, 'customRoles')), 3, 1000);
        const roles: CustomRole[] = [];
        rolesSnapshot.forEach(doc => {
          roles.push({ id: doc.id, ...doc.data() } as CustomRole);
        });
        setCustomRoles(roles);

        // 載入用戶
        const usersSnapshot = await retry(() => getDocs(collection(db, 'members')), 3, 1000);
        const usersData: UserWithRole[] = [];
        usersSnapshot.forEach(doc => {
          const userData = { uid: doc.id, ...doc.data() } as AppUser;
          const currentRole = userData.currentRole || 'guest';
          
          // 判斷是否為自訂角色
          const customRole = roles.find(r => r.id === currentRole);
          const isCustomRole = !!customRole;
          
          // 取得角色顯示名稱
          let roleDisplayName: string;
          if (isCustomRole) {
            roleDisplayName = customRole.name;
          } else {
            roleDisplayName = ROLE_NAMES[currentRole as RoleKey] || currentRole;
          }

          usersData.push({
            ...userData,
            roleDisplayName,
            isCustomRole,
            currentRole,
          });
        });
        setUsers(usersData);
      }, (error) => {
        logError(error, { operation: 'load_management_data' });
        setMessage('無法載入用戶列表');
      });
      setLoadingUsers(false);
    };

    void loadData();
  }, []);

  const handleRoleChange = async (uid: string, newRole: string) => {
    setSavingId(uid);
    setMessage('');
    
    await safeAsync(async () => {
      await retry(() => updateDoc(doc(db, 'members', uid), { currentRole: newRole }), 3, 1000);
      
      // 更新本地狀態
      setUsers(prev => prev.map(u => {
        if (u.uid === uid) {
          const customRole = customRoles.find(r => r.id === newRole);
          const isCustomRole = !!customRole;
          const roleDisplayName = isCustomRole 
            ? customRole.name 
            : ROLE_NAMES[newRole as RoleKey] || newRole;
          
          return {
            ...u,
            currentRole: newRole,
            roleDisplayName,
            isCustomRole,
          };
        }
        return u;
      }));
      
      setMessage('角色已更新');
    }, (error) => {
      setMessage(`更新失敗: ${getErrorMessage(error)}`);
      logError(error, { operation: 'update_user_role', userId: uid });
    });
    
    setSavingId(null);
  };

  // 取得所有可用角色選項
  const getRoleOptions = () => {
    const options = [
      { value: 'owner', label: '擁有者' },
      { value: 'guest', label: '訪客' },
    ];
    
    // 加入自訂角色
    customRoles.forEach(role => {
      options.push({ value: role.id, label: role.name });
    });
    
    return options;
  };

  if (loading || loadingUsers) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  return (
    <main className='max-w-6xl mx-auto p-6'>
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
        <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-6'>
          用戶管理
        </h1>

        {message && (
          <div className='mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800'>
            {message}
          </div>
        )}

        <div className='overflow-x-auto'>
          <table className='w-full border-collapse'>
            <thead>
              <tr className='bg-gray-50 dark:bg-gray-900'>
                <th className='px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700'>
                  姓名
                </th>
                <th className='px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700'>
                  Email
                </th>
                <th className='px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700'>
                  目前角色
                </th>
                <th className='px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700'>
                  切換角色
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
              {users.map(user => (
                <tr key={user.uid} className='hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors'>
                  <td className='px-4 py-3 text-sm text-gray-900 dark:text-gray-100'>
                    {user.displayName || '-'}
                  </td>
                  <td className='px-4 py-3 text-sm text-gray-900 dark:text-gray-100'>
                    {user.email || '-'}
                  </td>
                  <td className='px-4 py-3 text-sm'>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.isCustomRole
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        : user.currentRole === 'owner'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {user.roleDisplayName}
                      {user.isCustomRole && ' (自訂)'}
                    </span>
                  </td>
                  <td className='px-4 py-3 text-sm'>
                    <select
                      value={user.currentRole || 'guest'}
                      onChange={e => void handleRoleChange(user.uid, e.target.value)}
                      disabled={savingId === user.uid}
                      className='px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50'
                    >
                      {getRoleOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {savingId === user.uid && (
                      <div className='ml-2 inline-flex items-center'>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500'></div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className='mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg'>
          <h3 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>角色說明</h3>
          <div className='text-sm text-gray-600 dark:text-gray-400 space-y-1'>
            <p><span className='font-medium'>擁有者：</span>擁有系統所有權限，可以管理角色和用戶</p>
            <p><span className='font-medium'>訪客：</span>僅能查看儀表板和個人資料</p>
            <p><span className='font-medium'>自訂角色：</span>由擁有者在系統設定中建立的角色</p>
          </div>
        </div>
      </div>
    </main>
  );
}
