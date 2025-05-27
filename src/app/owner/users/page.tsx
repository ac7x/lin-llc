"use client";

import { useEffect, useState } from 'react';
import { updateUserRole } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';

type FirebaseAuthUser = {
  uid: string;
  email?: string;
  displayName?: string;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  disabled?: boolean;
  role?: string; // 新增 role 欄位
};

async function fetchUsers(): Promise<FirebaseAuthUser[]> {
  // 僅供展示，實際應於 server 端實作
  const res = await fetch('/api/admin/list-users');
  if (!res.ok) throw new Error('無法取得用戶列表');
  return res.json();
}

async function deleteUser(uid: string): Promise<void> {
  // 僅供展示，實際應於 server 端實作
  const res = await fetch(`/api/admin/delete-user?uid=${uid}`, { method: 'POST' });
  if (!res.ok) throw new Error('刪除失敗');
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<FirebaseAuthUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            let errorMsg = '發生錯誤';
            if (err instanceof Error) {
                errorMsg = err.message;
            }
            setError(errorMsg);
        }
    };

    const handleRoleChange = async (uid: string, newRole: string) => {
        try {
            await updateUserRole(uid, newRole);
            setUsers(users => users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
        } catch (err: unknown) {
            let errorMsg = '角色更新失敗';
            if (err instanceof Error) errorMsg = err.message;
            setError(errorMsg);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="max-w-3xl mx-auto px-2 py-8">
                <h1 className="text-2xl font-bold mb-4 text-center">Firebase 用戶管理</h1>
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
                            <th className="border px-2 py-1">角色</th> {/* 新增角色欄位 */}
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
                                        <option value="user">user</option>
                                        <option value="admin">admin</option>
                                        <option value="owner">owner</option>
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
