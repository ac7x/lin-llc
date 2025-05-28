"use client";

import { useEffect, useState } from 'react';
import { createVirtualUser, db } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { collection, getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';

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

// Modified fetchUsers to use Firestore direct SDK
async function fetchUsers(): Promise<FirebaseAuthUser[]> {
  if (!db) {
    console.error("Firestore database is not initialized.");
    return [];
  }
  const usersCollectionRef = collection(db, "users");
  const usersSnap = await getDocs(usersCollectionRef);
  return usersSnap.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    
    // Helper to convert Firestore Timestamp to ISO string or return string directly
    const formatTimeString = (timeField: any): string | undefined => {
      if (!timeField) return undefined;
      if (typeof timeField.toDate === 'function') return timeField.toDate().toISOString();
      if (typeof timeField === 'string') return timeField;
      return String(timeField); // Fallback
    };

    // Helper to convert Firestore Timestamp to Date or return Date directly
    const formatDate = (dateField: any): Date | undefined => {
      if (!dateField) return undefined;
      if (typeof dateField.toDate === 'function') return dateField.toDate();
      if (dateField instanceof Date) return dateField;
      // Attempt to parse if it's a string or number, though direct Date or Timestamp is expected
      const parsedDate = new Date(dateField);
      return !isNaN(parsedDate.getTime()) ? parsedDate : undefined;
    };

    return {
      uid: docSnapshot.id,
      email: data.email,
      displayName: data.displayName,
      emailVerified: data.emailVerified,
      photoURL: data.photoURL,
      updatedAt: formatDate(data.updatedAt),
      role: data.role,
      metadata: data.metadata ? {
        creationTime: formatTimeString(data.metadata.creationTime),
        lastSignInTime: formatTimeString(data.metadata.lastSignInTime),
      } : undefined,
      disabled: data.disabled,
    } as FirebaseAuthUser;
  });
}

// Modified deleteUser to use Firestore direct SDK
async function deleteUser(uid: string): Promise<void> {
  if (!db) {
    console.error("Firestore database is not initialized for delete operation.");
    throw new Error("Database not initialized");
  }
  await deleteDoc(doc(db, "users", uid));
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<FirebaseAuthUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 新增表單狀態
    const [newDisplayName, setNewDisplayName] = useState('');

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
            await deleteUser(uid); // This now calls the modified deleteUser
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
            // Modified to use Firestore direct SDK
            if (!db) {
              console.error("Firestore database is not initialized for role update.");
              throw new Error("Database not initialized");
            }
            await updateDoc(doc(db, "users", uid), { role: newRole });
            setUsers(users => users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
        } catch (err: unknown) {
            let errorMsg = '角色更新失敗';
            if (err instanceof Error) errorMsg = err.message;
            setError(errorMsg);
        }
    };

    // 虛擬用戶建立處理，只能建立 user 角色
    const handleCreateVirtualUser = async () => {
        if (!newDisplayName) {
            setError('請輸入名稱');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // 呼叫後端 API 建立虛擬用戶
            const newUser = await createVirtualUser({
                displayName: newDisplayName,
                role: 'user',
            });
            setUsers(users => [newUser, ...users]);
            setNewDisplayName('');
        } catch (err: unknown) {
            let errorMsg = '建立虛擬用戶失敗';
            if (err instanceof Error) errorMsg = err.message;
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="max-w-3xl mx-auto px-2 py-8">
                <h1 className="text-2xl font-bold mb-4 text-center">Firebase 用戶管理</h1>
                {/* 新增虛擬用戶表單，只能建立 user 角色 */}
                <div className="mb-6 flex flex-col sm:flex-row gap-2 items-center justify-center">
                    <input
                        type="text"
                        placeholder="名稱"
                        value={newDisplayName}
                        onChange={e => setNewDisplayName(e.target.value)}
                        className="border rounded px-2 py-1 w-40"
                    />
                    <span className="px-2">角色: <span className="font-semibold">user</span></span>
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
                                        disabled={user.role === 'owner'}
                                    >
                                        <option value="">—</option>
                                        <option value="admin">admin</option>
                                        <option value="finance">finance</option>
                                        {/* 不允許 admin 編輯 owner 角色，也不顯示 owner 選項 */}
                                        <option value="user">user</option>
                                        <option value="vendor">vendor</option>
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
