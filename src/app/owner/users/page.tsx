"use client";

import { useEffect, useState } from 'react';
import { updateUserRole, getUsersList, deleteUserFromFirestore, createVirtualUser } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';

type FirebaseAuthUser = {
  uid: string;
  email?: string;
  displayName?: string;
  emailVerified?: boolean;
  photoURL?: string;
  updatedAt?: Date;
  role?: string;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  disabled?: boolean;
};

async function fetchUsers(): Promise<FirebaseAuthUser[]> {
  return await getUsersList();
}

async function deleteUser(uid: string): Promise<void> {
  await deleteUserFromFirestore(uid);
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<FirebaseAuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchUsers()
      .then(setUsers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (uid: string) => {
    if (!window.confirm('確定要刪除此用戶？')) return;
    try {
      await deleteUser(uid);
      setUsers(users => users.filter(u => u.uid !== uid));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '發生錯誤');
    }
  };

  const handleRoleChange = async (uid: string, newRole: string) => {
    try {
      await updateUserRole(uid, newRole);
      setUsers(users => users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '角色更新失敗');
    }
  };

  const handleCreateVirtualUser = async () => {
    if (!newDisplayName || !newRole) {
      setError('請輸入名稱並選擇角色');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const newUser = await createVirtualUser({
        displayName: newDisplayName,
        role: newRole,
      });
      setUsers(users => [newUser, ...users]);
      setNewDisplayName('');
      setNewRole('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '建立虛擬用戶失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-3xl mx-auto px-2 py-8">
        <h1 className="text-2xl font-bold mb-4 text-center">Firebase 用戶管理</h1>
        <div className="mb-6 flex flex-col sm:flex-row gap-2 items-center justify-center">
          <input
            type="text"
            placeholder="名稱"
            value={newDisplayName}
            onChange={e => setNewDisplayName(e.target.value)}
            className="border rounded px-2 py-1 w-40"
          />
          <select
            value={newRole}
            onChange={e => setNewRole(e.target.value)}
            className="border rounded px-2 py-1 w-32 bg-white dark:bg-gray-800"
          >
            <option value="">選擇角色</option>
            <option value="admin">admin</option>
            <option value="finance">finance</option>
            <option value="owner">owner</option>
            <option value="user">user</option>
            <option value="vendor">vendor</option>
            <option value="foreman">foreman</option>
            <option value="safety">safety</option>
            <option value="coord">coord</option>
            <option value="helper">helper</option>
            <option value="temporary">temporary</option>
          </select>
          <button
            onClick={handleCreateVirtualUser}
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
            type="button"
          >
            建立虛擬用戶
          </button>
        </div>
        {loading && <div>載入中...</div>}
        {error && <div className="text-red-600">{error}</div>}
        <table className="w-full border-collapse mb-8 text-left">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="border px-2 py-1">UID</th>
              <th className="border px-2 py-1">Email</th>
              <th className="border px-2 py-1">名稱</th>
              <th className="border px-2 py-1">建立時間</th>
              <th className="border px-2 py-1">最後登入</th>
              <th className="border px-2 py-1">狀態</th>
              <th className="border px-2 py-1">角色</th>
              <th className="border px-2 py-1">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.uid} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800">
                <td className="border px-2 py-1">{user.uid}</td>
                <td className="border px-2 py-1">{user.email || '—'}</td>
                <td className="border px-2 py-1">{user.displayName || '—'}</td>
                <td className="border px-2 py-1">{user.metadata?.creationTime?.slice(0, 10) || '—'}</td>
                <td className="border px-2 py-1">{user.metadata?.lastSignInTime?.slice(0, 10) || '—'}</td>
                <td className="border px-2 py-1">{user.disabled ? '停用' : '啟用'}</td>
                <td className="border px-2 py-1">
                  <select
                    value={user.role || ''}
                    onChange={e => handleRoleChange(user.uid, e.target.value)}
                    className="border rounded px-1 py-0.5 bg-white dark:bg-gray-800"
                  >
                    <option value="">—</option>
                    <option value="admin">admin</option>
                    <option value="finance">finance</option>
                    <option value="owner">owner</option>
                    <option value="user">user</option>
                    <option value="vendor">vendor</option>
                    <option value="foreman">foreman</option>
                    <option value="safety">safety</option>
                    <option value="coord">coord</option>
                    <option value="helper">helper</option>
                    <option value="temporary">temporary</option>
                  </select>
                </td>
                <td className="border px-2 py-1">
                  <button
                    onClick={() => handleDelete(user.uid)}
                    className="text-red-600 hover:underline"
                    type="button"
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
}