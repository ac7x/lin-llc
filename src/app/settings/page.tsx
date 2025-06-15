/**
 * 系統設定頁面
 * 
 * 提供系統管理員進行系統設定的介面，包含：
 * - 封存設定（自動刪除天數）
 * - 角色權限管理
 * - 系統權限設定
 * - 導航權限設定
 * 
 * 僅系統管理員可訪問此頁面
 */

"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_HIERARCHY, ROLE_NAMES, RoleKey } from "@/utils/roleHierarchy";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionCategory } from '@/components/settings/PermissionCategory';
import type { Permission, Role } from '@/types/permission';

export default function OwnerSettingsPage() {
    const { user, isOwner } = useAuth();
    const router = useRouter();
    const [archiveRetentionDays, setArchiveRetentionDays] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [isEditingRetentionDays, setIsEditingRetentionDays] = useState(false);
    const [tempRetentionDays, setTempRetentionDays] = useState<number | null>(null);
    
    // 權限管理相關狀態
    const [selectedRolesForPermission, setSelectedRolesForPermission] = useState<Role[]>([]);
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

    // 確保所有預設類別都存在
    const defaultCategories = useMemo(() => 
        ['儀表板管理', '專案管理', '工作包管理', '財務管理', '用戶管理', '系統管理', '通知管理'],
        []
    );

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
    const groupedPermissions = useMemo(() => {
        const groups = filteredPermissions.reduce((acc, permission) => {
            if (!acc[permission.category]) {
                acc[permission.category] = [];
            }
            acc[permission.category].push(permission);
            return acc;
        }, {} as Record<string, Permission[]>);

        // 確保所有預設類別都存在，即使沒有權限
        defaultCategories.forEach(category => {
            if (!groups[category]) {
                groups[category] = [];
            }
        });

        return groups;
    }, [filteredPermissions, defaultCategories]);

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
        if (selectedRolesForPermission.length === 0 || !user) return;
        
        try {
            setUpdating(true);
            const success = await updatePermissions(
                selectedRolesForPermission,
                selectedPermissions,
                selectedNavPermissions
            );
            
            if (success) {
                alert(`已更新 ${selectedRolesForPermission.join(', ')} 的權限設定`);
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
    const handleRoleSelect = (roles: Role[]) => {
        setSelectedRolesForPermission(roles);
        
        // 合併所有選中角色的權限
        const combinedPermissions = roles.flatMap(role => {
            const rolePermission = rolePermissions.find(rp => rp.role === role);
            return rolePermission?.permissions || [];
        });
        setSelectedPermissions([...new Set(combinedPermissions)]);
        
        // 合併所有選中角色的導航權限
        const combinedNavPermissions = roles.flatMap(role => 
            navPermissions
                .filter(np => np.defaultRoles.includes(role))
                .map(np => np.id)
        );
        setSelectedNavPermissions([...new Set(combinedNavPermissions)]);
    };

    // 初始化時展開所有類別
    useEffect(() => {
        setExpandedCategories(new Set(defaultCategories));
    }, [defaultCategories]);

    // 檢查用戶權限
    useEffect(() => {
        if (!loading && !isOwner) {
            router.push('/');
        }
    }, [loading, isOwner, router]);

    if (loading || permissionsLoading) return <main className="p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">載入中...</main>;
    if (!isOwner) return null;

    return (
        <main className="p-6 pb-24 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">系統設定</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 左側：封存設定和角色選擇區塊 */}
                <div className="lg:col-span-3 space-y-6">
                    {/* 封存設定 */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg sticky top-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                            封存設定
                        </h2>
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

                    {/* 角色選擇 */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg sticky top-[calc(6rem+300px)]">
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            選擇角色
                        </h2>
                        <div className="space-y-2">
                            {Object.entries(ROLE_HIERARCHY)
                                .sort(([,a], [,b]) => b - a)
                                .map(([role, level]) => {
                                    const roleKey = role as RoleKey;
                                    return (
                                        <div key={role} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`role-${role}`}
                                                checked={selectedRolesForPermission.includes(role as Role)}
                                                onChange={(e) => {
                                                    const roleKey = role as Role;
                                                    const newRoles = e.target.checked
                                                        ? [...selectedRolesForPermission, roleKey]
                                                        : selectedRolesForPermission.filter(r => r !== roleKey);
                                                    handleRoleSelect(newRoles);
                                                }}
                                                className="mr-2"
                                            />
                                            <label htmlFor={`role-${role}`} className="text-sm">
                                                {ROLE_NAMES[roleKey]} ({role}) - 權限等級: {level}
                                            </label>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>

                {/* 中間：系統權限設定區塊 */}
                <div className="lg:col-span-5">
                    {selectedRolesForPermission.length > 0 ? (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                            <h2 className="text-xl font-semibold mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                系統權限設定
                            </h2>
                            
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="搜尋權限..."
                                    className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
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
                    ) : (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex items-center justify-center h-[calc(100vh-300px)]">
                            <div className="text-center text-gray-500 dark:text-gray-400">
                                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <p className="text-lg">請從左側選擇一個或多個角色來管理權限</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 右側：導航權限設定區塊 */}
                <div className="lg:col-span-4">
                    {selectedRolesForPermission.length > 0 ? (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                            <h2 className="text-xl font-semibold mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                導航權限設定
                            </h2>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="搜尋導航項目..."
                                    className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700"
                                    value={navSearchTerm}
                                    onChange={(e) => setNavSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
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

                            <button
                                onClick={handlePermissionUpdate}
                                disabled={updating}
                                className="mt-6 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed w-full flex items-center justify-center"
                            >
                                {updating ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        更新中...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        更新權限設定
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex items-center justify-center h-[calc(100vh-300px)]">
                            <div className="text-center text-gray-500 dark:text-gray-400">
                                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                <p className="text-lg">請從左側選擇一個或多個角色來管理導航權限</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
