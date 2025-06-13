"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_HIERARCHY, ROLE_NAMES, RoleKey } from "@/utils/roleHierarchy";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionCategory } from '@/components/settings/PermissionCategory';
import type { Permission } from '@/types/settings';

export default function OwnerSettingsPage() {
    const { user, isOwner } = useAuth();
    const router = useRouter();
    const [archiveRetentionDays, setArchiveRetentionDays] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [isEditingRetentionDays, setIsEditingRetentionDays] = useState(false);
    const [tempRetentionDays, setTempRetentionDays] = useState<number | null>(null);
    
    // 權限管理相關狀態
    const [selectedRoleForPermission, setSelectedRoleForPermission] = useState<string>("");
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [selectedNavPermissions, setSelectedNavPermissions] = useState<string[]>([]);
    const [navSearchTerm, setNavSearchTerm] = useState<string>("");

    const {
        permissions,
        rolePermissions,
        navPermissions,
        loading: permissionsLoading,
        updatePermissions
    } = usePermissions(user?.uid);

    // 檢查用戶權限
    useEffect(() => {
        if (!loading && !isOwner) {
            router.push('/shared/signin');
        }
    }, [loading, isOwner, router]);

    // 載入現有設定
    useEffect(() => {
        async function fetchRetentionDays() {
            if (!user) return;
            
            const docRef = doc(db, 'settings', 'archive');
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                const data = snapshot.data();
                setArchiveRetentionDays(typeof data.retentionDays === 'number' ? data.retentionDays : null);
            } else {
                setArchiveRetentionDays(null);
            }
            setLoading(false);
        }
        fetchRetentionDays();
    }, [user]);

    // 根據搜尋條件過濾權限
    const filteredPermissions = useMemo(() => 
        permissions.filter(permission => 
            permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            permission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            permission.category.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        [permissions, searchTerm]
    );

    // 按類別分組權限
    const groupedPermissions = useMemo(() => 
        filteredPermissions.reduce((acc, permission) => {
            if (!acc[permission.category]) {
                acc[permission.category] = [];
            }
            acc[permission.category].push(permission);
            return acc;
        }, {} as Record<string, Permission[]>),
        [filteredPermissions]
    );

    // 確保所有預設類別都存在
    const defaultCategories = useMemo(() => 
        ['專案管理', '工作包管理', '財務管理', '用戶管理', '系統管理', '通知管理'],
        []
    );

    // 切換類別展開狀態
    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            return newSet;
        });
    };

    // 處理封存天數更新
    const handleRetentionDaysUpdate = async () => {
        if (!tempRetentionDays || tempRetentionDays <= 0 || !user) return;
        
        try {
            setUpdating(true);
            await setDoc(doc(db, 'settings', 'archive'), { 
                retentionDays: tempRetentionDays,
                lastUpdatedBy: user.uid,
                lastUpdatedAt: new Date().toISOString()
            }, { merge: true });
            setArchiveRetentionDays(tempRetentionDays);
            setIsEditingRetentionDays(false);
        } catch (error) {
            console.error('更新封存天數失敗:', error);
            alert('更新封存天數失敗，請稍後再試');
        } finally {
            setUpdating(false);
        }
    };

    // 處理權限更新
    const handlePermissionUpdate = async () => {
        if (!selectedRoleForPermission || !user) return;
        
        try {
            setUpdating(true);
            const success = await updatePermissions(
                selectedRoleForPermission,
                selectedPermissions,
                selectedNavPermissions
            );
            
            if (success) {
                alert(`已更新 ${selectedRoleForPermission} 的權限設定`);
                router.refresh();
            } else {
                alert('更新權限失敗，請稍後再試');
            }
        } catch (error) {
            console.error('更新權限失敗:', error);
            alert('更新權限失敗，請稍後再試');
        } finally {
            setUpdating(false);
        }
    };

    // 處理角色選擇
    const handleRoleSelect = (role: string) => {
        setSelectedRoleForPermission(role);
        const rolePermission = rolePermissions.find(rp => rp.role === role);
        setSelectedPermissions(rolePermission?.permissions || []);
        
        // 更新選中的導航權限
        const roleNavPermissions = navPermissions
            .filter(np => np.defaultRoles.includes(role))
            .map(np => np.id);
        setSelectedNavPermissions(roleNavPermissions);
    };

    // 初始化時展開所有類別
    useEffect(() => {
        setExpandedCategories(new Set(defaultCategories));
    }, [defaultCategories]);

    if (loading || permissionsLoading) return <main className="p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">載入中...</main>;
    if (!isOwner) return null;

    return (
        <main className="p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-4">系統設定</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* 封存設定區塊 */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow lg:col-span-1">
                    <h2 className="text-xl font-semibold mb-4">封存設定</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block font-medium mb-1">
                                封存自動刪除天數
                            </label>
                            {isEditingRetentionDays ? (
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="number"
                                        min={1}
                                        className="border rounded px-2 py-1 w-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        value={tempRetentionDays ?? ''}
                                        onChange={e => setTempRetentionDays(Number(e.target.value))}
                                    />
                                    <span className="text-gray-500 dark:text-gray-400">天</span>
                                    <button
                                        onClick={handleRetentionDaysUpdate}
                                        disabled={updating}
                                        className="text-green-600 hover:text-green-700 disabled:text-gray-400"
                                    >
                                        {updating ? '儲存中...' : '✓'}
                                    </button>
                                    <button
                                        onClick={() => setIsEditingRetentionDays(false)}
                                        disabled={updating}
                                        className="text-red-600 hover:text-red-700 disabled:text-gray-400"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <span className="text-gray-900 dark:text-gray-100">
                                        {archiveRetentionDays ?? '未設定'} 天
                                    </span>
                                    <button
                                        onClick={() => {
                                            setTempRetentionDays(archiveRetentionDays);
                                            setIsEditingRetentionDays(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-700"
                                    >
                                        編輯
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 角色權限設定區塊 */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow lg:col-span-3">
                    <h2 className="text-xl font-semibold mb-4">角色權限管理</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block font-medium mb-1">選擇角色</label>
                            <select
                                className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700"
                                value={selectedRoleForPermission}
                                onChange={(e) => handleRoleSelect(e.target.value)}
                            >
                                <option value="">請選擇角色</option>
                                {Object.entries(ROLE_HIERARCHY)
                                    .sort(([,a], [,b]) => b - a)
                                    .map(([role, level]) => {
                                        const roleKey = role as RoleKey;
                                        return (
                                            <option key={role} value={role}>
                                                {ROLE_NAMES[roleKey]} ({role}) - 權限等級: {level}
                                            </option>
                                        );
                                    })
                                }
                            </select>
                        </div>

                        {selectedRoleForPermission && (
                            <>
                                {/* 系統權限設定 */}
                                <div>
                                    <div className="mb-4">
                                        <input
                                            type="text"
                                            placeholder="搜尋權限..."
                                            className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <label className="block font-medium mb-1">系統權限設定</label>
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                        {Object.entries(groupedPermissions).map(([category, perms]) => (
                                            <PermissionCategory
                                                key={category}
                                                category={category}
                                                permissions={perms}
                                                selectedPermissions={selectedPermissions}
                                                onPermissionChange={(permissionId, checked) => {
                                                    if (checked) {
                                                        setSelectedPermissions([...selectedPermissions, permissionId]);
                                                    } else {
                                                        setSelectedPermissions(selectedPermissions.filter(id => id !== permissionId));
                                                    }
                                                }}
                                                isExpanded={expandedCategories.has(category)}
                                                onToggle={() => toggleCategory(category)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* 導航權限設定 */}
                                <div className="mt-6">
                                    <div className="mb-4">
                                        <input
                                            type="text"
                                            placeholder="搜尋導航項目..."
                                            className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700"
                                            value={navSearchTerm}
                                            onChange={(e) => setNavSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <label className="block font-medium mb-1">導航權限設定</label>
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                        <div className="border rounded-lg overflow-hidden">
                                            <div className="p-4 space-y-2">
                                                {navPermissions
                                                    .filter(np => 
                                                        np.name.toLowerCase().includes(navSearchTerm.toLowerCase()) ||
                                                        np.description.toLowerCase().includes(navSearchTerm.toLowerCase())
                                                    )
                                                    .map(navPermission => (
                                                        <div key={navPermission.id} className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                id={`nav-${navPermission.id}`}
                                                                checked={selectedNavPermissions.includes(navPermission.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedNavPermissions([...selectedNavPermissions, navPermission.id]);
                                                                    } else {
                                                                        setSelectedNavPermissions(selectedNavPermissions.filter(id => id !== navPermission.id));
                                                                    }
                                                                }}
                                                                className="mr-2"
                                                            />
                                                            <label htmlFor={`nav-${navPermission.id}`} className="text-sm">
                                                                {navPermission.name}
                                                                <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">
                                                                    ({navPermission.description})
                                                                </span>
                                                            </label>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePermissionUpdate}
                                    disabled={updating}
                                    className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed w-full"
                                >
                                    {updating ? '更新中...' : '更新權限設定'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
