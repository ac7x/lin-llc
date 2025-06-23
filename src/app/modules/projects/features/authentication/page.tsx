"use client";

import { useState, useEffect, useCallback } from 'react';
import { useFirebase } from '../../components/firebase/FirebaseProvider';
import { UserRole, hasRequiredRole } from '../../types/roles';
import { setUserRole, getAllUsers } from '../../actions/admin';
import { LoadingSpinner, PageContainer, PageHeader } from '../../components/common';
import { projectStyles } from '../../styles';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  disabled: boolean;
  emailVerified: boolean;
  role: UserRole;
}

interface UserActionResult {
  status: 'success' | 'error';
  message: string;
}

export default function AuthenticationPage() {
  const { 
    currentUser, 
    currentRole, 
    getTokensForServerAction, 
    refreshIdToken,
    loading: firebaseLoading 
  } = useFirebase();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<UserActionResult | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>(UserRole.USER);

  // 載入用戶列表
  const loadUsers = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);
    
    try {
      const tokens = await getTokensForServerAction();
      if (!tokens?.idToken || !tokens?.appCheckToken) {
        throw new Error('無法獲取認證令牌');
      }

      const result = await getAllUsers(tokens.appCheckToken, tokens.idToken);
      
      if (result.status === 'success' && result.users) {
        // 轉換用戶資料以符合 User 介面，將 undefined 轉換為 null
        const formattedUsers: User[] = result.users.map((user: any) => ({
          uid: user.uid,
          email: user.email || null,
          displayName: user.displayName || null,
          photoURL: user.photoURL || null,
          disabled: user.disabled,
          emailVerified: user.emailVerified,
          role: user.role,
        }));
        setUsers(formattedUsers);
      } else {
        throw new Error(result.message || '載入用戶列表失敗');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入用戶列表失敗';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentUser, getTokensForServerAction]);

  // 設置用戶角色
  const handleSetUserRole = useCallback(async (targetUid: string, role: UserRole) => {
    if (!currentUser) return;

    setLoading(true);
    setActionResult(null);
    
    try {
      const tokens = await getTokensForServerAction();
      if (!tokens?.idToken || !tokens?.appCheckToken) {
        throw new Error('無法獲取認證令牌');
      }

      const result = await setUserRole(targetUid, role, tokens.appCheckToken, tokens.idToken);
      
      if (result.status === 'success') {
        setActionResult({ status: 'success', message: result.message });
        // 重新載入用戶列表以更新角色顯示
        await loadUsers();
        // 如果修改的是當前用戶，刷新 ID Token 以獲取最新聲明
        if (targetUid === currentUser.uid) {
          await refreshIdToken();
        }
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '設置用戶角色失敗';
      setActionResult({ status: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [currentUser, getTokensForServerAction, loadUsers, refreshIdToken]);

  // 打開角色設置模態框
  const openRoleModal = useCallback((user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  }, []);

  // 確認角色設置
  const confirmRoleChange = useCallback(async () => {
    if (!selectedUser) return;
    
    await handleSetUserRole(selectedUser.uid, newRole);
    setShowRoleModal(false);
    setSelectedUser(null);
  }, [selectedUser, newRole, handleSetUserRole]);

  // 初始化載入
  useEffect(() => {
    if (currentUser && hasRequiredRole(currentRole, UserRole.MANAGER)) {
      loadUsers();
    }
  }, [currentUser, currentRole, loadUsers]);

  // 權限檢查
  if (firebaseLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            需要登入
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            請先登入以訪問用戶管理功能
          </p>
        </div>
      </div>
    );
  }

  if (!hasRequiredRole(currentRole, UserRole.MANAGER)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            權限不足
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            您需要 MANAGER 或更高權限才能訪問用戶管理功能
          </p>
          <p className="text-sm text-gray-500 mt-2">
            當前角色: {currentRole}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="用戶及權限管理" 
        subtitle="管理系統用戶和角色權限"
      >
        <div className="flex space-x-2">
          <button
            onClick={loadUsers}
            disabled={loading}
            className={projectStyles.button.outline}
          >
            {loading ? '載入中...' : '重新載入'}
          </button>
        </div>
      </PageHeader>

      {/* 錯誤顯示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 操作結果顯示 */}
      {actionResult && (
        <div className={`mb-4 p-4 border rounded-lg ${
          actionResult.status === 'success' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <p className={actionResult.status === 'success' ? 'text-green-600' : 'text-red-600'}>
            {actionResult.message}
          </p>
        </div>
      )}

      {/* 當前用戶資訊 */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">當前用戶資訊</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-blue-700">Email:</span> {currentUser.email}
          </div>
          <div>
            <span className="text-blue-700">UID:</span> {currentUser.uid}
          </div>
          <div>
            <span className="text-blue-700">角色:</span> {currentRole}
          </div>
        </div>
      </div>

      {/* 用戶列表 */}
      <div className="bg-white dark:bg-gray-900 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            用戶列表 ({users.length})
          </h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <LoadingSpinner size="medium" />
            <p className="mt-2 text-gray-600 dark:text-gray-400">載入用戶資料中...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    用戶資訊
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    狀態
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img 
                            className="h-10 w-10 rounded-full" 
                            src={user.photoURL || '/default-avatar.png'} 
                            alt=""
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {user.displayName || '未設定名稱'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.disabled 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {user.disabled ? '已停用' : '啟用中'}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.emailVerified 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {user.emailVerified ? '已驗證' : '未驗證'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === UserRole.OWNER ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                        user.role === UserRole.ADMIN ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        user.role === UserRole.MANAGER ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        user.role === UserRole.FOREMAN ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {hasRequiredRole(currentRole, UserRole.ADMIN) && (
                        <button
                          onClick={() => openRoleModal(user)}
                          disabled={loading}
                          className={projectStyles.button.outline}
                        >
                          設置角色
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 角色設置模態框 */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-900">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                設置用戶角色
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  用戶: {selectedUser.displayName || selectedUser.email}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  當前角色: {selectedUser.role}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  新角色
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100"
                >
                  {Object.values(UserRole).map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className={projectStyles.button.outline}
                >
                  取消
                </button>
                <button
                  onClick={confirmRoleChange}
                  disabled={loading || newRole === selectedUser.role}
                  className={projectStyles.button.primary}
                >
                  {loading ? '設置中...' : '確認設置'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
