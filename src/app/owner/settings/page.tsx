"use client";

import { useState, useEffect } from 'react';
import { useFirebase } from "@/hooks/useFirebase";
import { useUserRole } from "@/hooks/useUserRole";
import { ROLE_HIERARCHY, RoleKey } from "@/utils/roleHierarchy";
import type { AppUser } from "@/types/user";

export default function OwnerSettingsPage() {
    const { db, doc, getDoc, setDoc, collection, getDocs, updateDoc } = useFirebase();
    const { isOwner } = useUserRole();
    const [archiveRetentionDays, setArchiveRetentionDaysState] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<AppUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>("");
    const [updating, setUpdating] = useState(false);

    // 載入所有使用者
    useEffect(() => {
        async function fetchUsers() {
            const usersCollection = collection(db, 'users');
            const snapshot = await getDocs(usersCollection);
            const usersData = snapshot.docs.map(doc => ({
                ...doc.data(),
                uid: doc.id
            })) as AppUser[];
            setUsers(usersData);
        }

        fetchUsers();
    }, [db, collection, getDocs]);

    // 載入現有設定
    useEffect(() => {
        async function fetchRetentionDays() {
            const docRef = doc(db, 'settings', 'archive');
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                const data = snapshot.data();
                setArchiveRetentionDaysState(typeof data.retentionDays === 'number' ? data.retentionDays : null);
            } else {
                setArchiveRetentionDaysState(null);
            }
            setLoading(false);
        }
        fetchRetentionDays();
    }, [db, doc, getDoc]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (archiveRetentionDays && archiveRetentionDays > 0) {
            await setDoc(doc(db, 'settings', 'archive'), { retentionDays: archiveRetentionDays }, { merge: true });
            alert(`已設定封存自動刪除天數為 ${archiveRetentionDays} 天`);
        }
    };

    const handleUserSelect = (userId: string) => {
        const user = users.find(u => u.uid === userId);
        setSelectedUser(user || null);
        setSelectedRole(user?.role || "");
    };

    const handleRoleUpdate = async () => {
        if (!selectedUser || !selectedRole || !isOwner) return;
        
        try {
            setUpdating(true);
            const userRef = doc(db, 'users', selectedUser.uid);
            await updateDoc(userRef, {
                role: selectedRole
            });
            
            // 更新本地狀態
            setUsers(prev => prev.map(user => 
                user.uid === selectedUser.uid 
                    ? { ...user, role: selectedRole }
                    : user
            ));
            
            alert(`已更新 ${selectedUser.displayName} 的角色為 ${selectedRole}`);
        } catch (error) {
            console.error('更新角色失敗:', error);
            alert('更新角色失敗，請稍後再試');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <main className="p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">載入中...</main>;

    if (!isOwner) {
        return (
            <main className="p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <h1 className="text-2xl font-bold mb-4">權限不足</h1>
                <p>您需要擁有者權限才能存取此頁面。</p>
            </main>
        );
    }

    return (
        <main className="p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-4">系統設定</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 封存設定區塊 */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">封存設定</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block font-medium mb-1">
                                封存自動刪除天數
                            </label>
                            <input
                                type="number"
                                min={1}
                                className="border rounded px-2 py-1 w-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                value={archiveRetentionDays ?? ''}
                                onChange={e => setArchiveRetentionDaysState(Number(e.target.value))}
                            />
                            <span className="ml-2 text-gray-500 dark:text-gray-400">天</span>
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            儲存封存設定
                        </button>
                    </form>
                </div>

                {/* 角色權限設定區塊 */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">角色權限管理</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block font-medium mb-1">選擇使用者</label>
                            <select
                                className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700"
                                value={selectedUser?.uid || ''}
                                onChange={(e) => handleUserSelect(e.target.value)}
                            >
                                <option value="">請選擇使用者</option>
                                {users.map(user => (
                                    <option key={user.uid} value={user.uid}>
                                        {user.displayName} ({user.email}) - {user.role}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedUser && (
                            <div>
                                <label className="block font-medium mb-1">選擇角色</label>
                                <select
                                    className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700"
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                >
                                    <option value="">請選擇角色</option>
                                    {Object.entries(ROLE_HIERARCHY)
                                        .sort(([,a], [,b]) => b - a)
                                        .map(([role, level]) => (
                                            <option key={role} value={role}>
                                                {role} (權限等級: {level})
                                            </option>
                                        ))
                                    }
                                </select>

                                <button
                                    onClick={handleRoleUpdate}
                                    disabled={updating || !selectedRole || selectedRole === selectedUser.role}
                                    className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed w-full"
                                >
                                    {updating ? '更新中...' : '更新角色'}
                                </button>
                            </div>
                        )}

                        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded">
                            <h3 className="font-medium mb-2">角色權限等級說明</h3>
                            <ul className="space-y-1 text-sm">
                                {Object.entries(ROLE_HIERARCHY)
                                    .sort(([,a], [,b]) => b - a)
                                    .map(([role, level]) => (
                                        <li key={role} className="flex justify-between">
                                            <span>{role}</span>
                                            <span className="text-gray-500 dark:text-gray-400">等級 {level}</span>
                                        </li>
                                    ))
                                }
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
