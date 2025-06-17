'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import Image from 'next/image';
import { db } from '@/lib/firebase-client';
import type { AppUser } from '@/types/user';
import RolePermissions from './components/RolePermissions';
import { type RoleKey, ROLE_NAMES } from '@/constants/roles';

interface UserManagementState {
  users: AppUser[];
  loading: boolean;
  error: string | null;
}

type TabType = 'users' | 'roles';

export default function ManagementPage(): React.ReactElement {
  const [state, setState] = useState<UserManagementState>({
    users: [],
    loading: true,
    error: null,
  });
  const [activeTab, setActiveTab] = useState<TabType>('users');

  useEffect(() => {
    if (activeTab === 'users') {
      void fetchUsers();
    }
  }, [activeTab]);

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

  const handleRoleChange = async (userId: string, newRole: RoleKey): Promise<void> => {
    try {
      const userRef = doc(db, 'members', userId);
      await updateDoc(userRef, {
        roles: [newRole],
        updatedAt: new Date().toISOString(),
      });
      await fetchUsers();
    } catch (error) {
      console.error('更新用戶角色失敗:', error);
    }
  };

  const handleStatusChange = async (userId: string, disabled: boolean): Promise<void> => {
    try {
      const userRef = doc(db, 'members', userId);
      await updateDoc(userRef, {
        disabled,
        updatedAt: new Date().toISOString(),
      });
      await fetchUsers();
    } catch (error) {
      console.error('更新用戶狀態失敗:', error);
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
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">系統管理</h1>
      
      {state.error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
          {state.error}
        </div>
      )}

      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`${
              activeTab === 'users'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            用戶管理
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`${
              activeTab === 'roles'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            角色權限
          </button>
        </nav>
      </div>

      {activeTab === 'users' ? (
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
                    <select
                      value={user.roles?.[0] || 'guest'}
                      onChange={(e) => handleRoleChange(user.uid, e.target.value as RoleKey)}
                      className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {Object.entries(ROLE_NAMES).map(([key, name]) => (
                        <option key={key} value={key}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleStatusChange(user.uid, !user.disabled)}
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.disabled
                          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      }`}
                    >
                      {user.disabled ? '已停用' : '啟用中'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <button
                      onClick={() => handleStatusChange(user.uid, !user.disabled)}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                    >
                      {user.disabled ? '啟用' : '停用'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <RolePermissions
            user={{} as AppUser}
            onUpdate={fetchUsers}
          />
        </div>
      )}
    </div>
  );
}
