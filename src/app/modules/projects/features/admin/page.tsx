/**
 * 專案管理頁面
 * 
 * 提供專案管理功能：
 * - 用戶管理
 * - 權限管理
 * - 角色管理
 * - 專案統計
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';
import { useProjectAdmin } from '../../hooks/useProjectAdmin';
import { AdminService } from '../../services/adminService';
import { 
  formatUserDisplayName, 
  formatUserRole, 
  formatPermission,
  calculateUserStats,
  calculateProjectHealthScore,
  getProjectHealthLevel,
  hasPermission,
  getUserAllPermissions,
} from '../../utils/adminUtils';

// 統計卡片組件
interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  color?: string;
}

const StatCard = ({ title, value, subtitle, color = 'text-blue-600' }: StatCardProps) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div className="flex items-center">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  </div>
);

// 用戶列表組件
const UserList = ({ users, onUpdateRole, onToggleStatus, onDelete }: {
  users: any[];
  onUpdateRole: (userId: string, role: string) => void;
  onToggleStatus: (userId: string, isActive: boolean) => void;
  onDelete: (userId: string) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !selectedRole || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">用戶管理</h3>
        <div className="mt-4 flex gap-4">
          <input
            type="text"
            placeholder="搜尋用戶..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="">所有角色</option>
            <option value="admin">管理員</option>
            <option value="manager">專案經理</option>
            <option value="member">成員</option>
            <option value="guest">訪客</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                用戶
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                角色
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                狀態
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                註冊時間
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {formatUserDisplayName(user).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatUserDisplayName(user)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                    value={user.role}
                    onChange={(e) => onUpdateRole(user.id, e.target.value)}
                  >
                    <option value="admin">管理員</option>
                    <option value="manager">專案經理</option>
                    <option value="member">成員</option>
                    <option value="guest">訪客</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {user.isActive ? '啟用' : '停用'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {user.createdAt.toLocaleDateString('zh-TW')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onToggleStatus(user.id, !user.isActive)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                  >
                    {user.isActive ? '停用' : '啟用'}
                  </button>
                  <button
                    onClick={() => onDelete(user.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    刪除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 權限管理組件
const PermissionManager = ({ users }: { users: any[] }) => {
  const [selectedUser, setSelectedUser] = useState<any>(null);

  if (!selectedUser) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">權限管理</h3>
        <p className="text-gray-600 dark:text-gray-400">請選擇用戶以查看和管理權限</p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.slice(0, 6).map((user) => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
            >
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {formatUserDisplayName(user)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {formatUserRole(user.role)}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const userPermissions = getUserAllPermissions(selectedUser);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">權限管理</h3>
        <button
          onClick={() => setSelectedUser(null)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          返回
        </button>
      </div>
      
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">
          {formatUserDisplayName(selectedUser)} 的權限
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          角色: {formatUserRole(selectedUser.role)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {userPermissions.map((permission) => (
          <div
            key={permission}
            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {formatPermission(permission)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading, hasPermission } = useAuth();
  const { 
    users, 
    stats, 
    loading, 
    error, 
    updateUserRole, 
    deactivateUser, 
    activateUser, 
    deleteUser,
    clearError 
  } = useProjectAdmin();

  // 檢查權限
  if (!authLoading && (!user || !hasPermission('admin'))) {
    router.push('/signin');
    return null;
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const userStats = calculateUserStats(users);
  const healthScore = calculateProjectHealthScore(stats);
  const healthLevel = getProjectHealthLevel(healthScore);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
    } catch (err) {
      console.error('更新角色失敗:', err);
    }
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await activateUser(userId);
      } else {
        await deactivateUser(userId);
      }
    } catch (err) {
      console.error('切換狀態失敗:', err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('確定要刪除此用戶嗎？此操作無法復原。')) {
      try {
        await deleteUser(userId);
      } catch (err) {
        console.error('刪除用戶失敗:', err);
      }
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">專案管理</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          管理用戶、權限和專案統計
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-1">
              <p className="text-red-600">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="總專案數"
          value={stats.totalProjects}
          subtitle={`${stats.activeProjects} 個進行中`}
        />
        <StatCard
          title="總用戶數"
          value={userStats.totalUsers}
          subtitle={`${userStats.activeUsers} 個活躍用戶`}
        />
        <StatCard
          title="平均進度"
          value={`${stats.averageProgress}%`}
          subtitle="所有專案平均"
        />
        <StatCard
          title="專案健康度"
          value={`${healthScore}%`}
          subtitle={healthLevel.label}
          color={healthLevel.color}
        />
      </div>

      {/* 用戶管理和權限管理 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <UserList
          users={users}
          onUpdateRole={handleUpdateRole}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteUser}
        />
        <PermissionManager users={users} />
      </div>
    </div>
  );
}
