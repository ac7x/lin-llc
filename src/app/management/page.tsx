'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import Image from 'next/image';
import { db } from '@/lib/firebase-client';
import type { AppUser } from '@/types/user';
import type { Role } from '@/types/permission';
import { getDefaultPermissionsForRole } from '@/constants/permissions';

interface UserManagementState {
  users: AppUser[];
  loading: boolean;
  error: string | null;
  selectedUser: AppUser | null;
  isEditing: boolean;
}

export default function ManagementPage(): React.ReactElement {
  const [state, setState] = useState<UserManagementState>({
    users: [],
    loading: true,
    error: null,
    selectedUser: null,
    isEditing: false,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (): Promise<void> => {
    try {
      const usersRef = collection(db, 'members');
      const snapshot = await getDocs(usersRef);
      const usersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id,
      })) as AppUser[];
      
      setState(prev => ({
        ...prev,
        users: usersData,
        loading: false,
      }));
    } catch {
      setState(prev => ({
        ...prev,
        error: '載入用戶資料失敗',
        loading: false,
      }));
    }
  };

  const handleRoleChange = async (userId: string, newRoles: Role[]): Promise<void> => {
    try {
      const userRef = doc(db, 'members', userId);
      const permissions = newRoles.flatMap(role => getDefaultPermissionsForRole(role));
      
      await updateDoc(userRef, {
        roles: newRoles,
        permissions: [...new Set(permissions)],
        updatedAt: new Date().toISOString(),
      });

      await fetchUsers();
    } catch {
      setState(prev => ({
        ...prev,
        error: '更新用戶角色失敗',
      }));
    }
  };

  if (state.loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-300">載入中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-white dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">用戶管理</h1>
      
      {state.error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
          {state.error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                用戶資訊
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                角色
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                狀態
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {state.users.map((user) => (
              <tr key={user.uid} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {user.photoURL && (
                      <div className="relative h-10 w-10">
                        <Image
                          className="rounded-full"
                          src={user.photoURL}
                          alt={user.displayName || ''}
                          fill
                          sizes="40px"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    )}
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.displayName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-2">
                    {user.roles?.map((role) => (
                      <span
                        key={role}
                        className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      user.disabled
                        ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    }`}
                  >
                    {user.disabled ? '已停用' : '啟用中'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <button
                    onClick={() => setState(prev => ({
                      ...prev,
                      selectedUser: user,
                      isEditing: true,
                    }))}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                  >
                    編輯
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {state.isEditing && state.selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
                編輯用戶角色
              </h3>
              <div className="mt-2 px-7 py-3">
                <div className="space-y-4">
                  {(['owner', 'admin', 'finance', 'user', 'helper', 'temporary', 'coord', 'safety', 'foreman', 'vendor'] as const).map((role) => (
                    <label key={role} className="flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-indigo-600 dark:text-indigo-400 rounded border-gray-300 dark:border-gray-600 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                        checked={state.selectedUser?.roles?.includes(role)}
                        onChange={(e) => {
                          if (!state.selectedUser) return;
                          const newRoles = e.target.checked
                            ? [...(state.selectedUser.roles || []), role]
                            : (state.selectedUser.roles || []).filter(r => r !== role);
                          handleRoleChange(state.selectedUser.uid, newRoles as Role[]);
                        }}
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">{role}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setState(prev => ({
                    ...prev,
                    isEditing: false,
                    selectedUser: null,
                  }))}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
