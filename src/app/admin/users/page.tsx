'use client';

import { useEffect, useState } from 'react';
import { AdminBottomNav } from '@/modules/shared/interfaces/navigation/admin-bottom-nav';

// 需建立一個 server action 來取得所有 firebase auth 用戶
async function fetchUsers(): Promise<FirebaseAuthUser[]> {
    'use server';
    // 這裡假設有一個 server action /api/admin/list-users
    const res = await fetch('/api/admin/list-users');
    if (!res.ok) throw new Error('無法取得用戶列表');
    return res.json();
}

// 需建立一個 server action 來刪除 firebase auth 用戶
async function deleteUser(uid: string): Promise<void> {
    'use server';
    await fetch(`/api/admin/delete-user?uid=${uid}`, { method: 'POST' });
}

type FirebaseAuthUser = {
    uid: string;
    email?: string;
    displayName?: string;
    disabled: boolean;
    metadata?: {
        creationTime?: string;
        lastSignInTime?: string;
    };
};

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
        } catch (e: any) {
            alert('刪除失敗: ' + (e?.message || e));
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
            <AdminBottomNav />
        </div>
    );
}
