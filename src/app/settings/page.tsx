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
import { useAuth } from "@/hooks/useAuth";
import { ROLE_NAMES } from "@/utils/authUtils";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionCategory } from './components/PermissionCategory';
import type { Role, UnifiedPermission } from '@/types/permission';

// 預設導航項目
const defaultNavItems = [
    {
        id: 'profile',
        name: '個人檔案',
        description: '個人資料管理',
        defaultRoles: ['owner', 'admin', 'finance', 'user', 'helper', 'temporary', 'coord', 'safety', 'foreman', 'vendor']
    },
    {
        id: 'dashboard',
        name: '儀表板',
        description: '顯示系統儀表板',
        defaultRoles: ['owner', 'admin', 'finance', 'user', 'helper', 'temporary', 'coord', 'safety', 'foreman', 'vendor']
    },
    {
        id: 'projects',
        name: '專案',
        description: '專案管理功能',
        defaultRoles: ['owner', 'admin', 'coord', 'foreman']
    },
    {
        id: 'schedule',
        name: '行程',
        description: '行程管理功能',
        defaultRoles: ['owner', 'admin', 'coord', 'foreman', 'safety']
    },
    {
        id: 'calendar',
        name: '日曆',
        description: '日曆管理功能',
        defaultRoles: ['owner', 'admin', 'coord', 'foreman', 'safety']
    },
    {
        id: 'quotes',
        name: '估價單',
        description: '估價單管理功能',
        defaultRoles: ['owner', 'admin', 'finance']
    },
    {
        id: 'contracts',
        name: '合約',
        description: '合約管理功能',
        defaultRoles: ['owner', 'admin', 'finance']
    },
    {
        id: 'orders',
        name: '訂單',
        description: '訂單管理功能',
        defaultRoles: ['owner', 'admin', 'finance']
    },
    {
        id: 'gemini',
        name: 'Gemini',
        description: 'AI 助手功能',
        defaultRoles: ['owner', 'admin']
    },
    {
        id: 'notifications',
        name: '通知',
        description: '通知管理功能',
        defaultRoles: ['owner', 'admin', 'finance', 'user', 'helper', 'temporary', 'coord', 'safety', 'foreman', 'vendor']
    },
    {
        id: 'send-notification',
        name: '發送通知',
        description: '發送通知功能',
        defaultRoles: ['owner', 'admin', 'coord', 'safety']
    },
    {
        id: 'users',
        name: '用戶管理',
        description: '用戶管理功能',
        defaultRoles: ['owner', 'admin']
    },
    {
        id: 'settings',
        name: '設定',
        description: '系統設定功能',
        defaultRoles: ['owner', 'admin']
    },
    {
        id: 'archive',
        name: '封存',
        description: '封存管理功能',
        defaultRoles: ['owner', 'admin']
    }
];

export default function OwnerSettingsPage() {
    const { user, userRoles } = useAuth();
    const { permissions, loading: permissionsLoading, error, updatePermissions } = usePermissions(user?.uid);
    const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [isUpdating, setIsUpdating] = useState(false);
    const [archiveRetentionDays, setArchiveRetentionDays] = useState<number | null>(null);
    const [isEditingRetentionDays, setIsEditingRetentionDays] = useState(false);
    const [tempRetentionDays, setTempRetentionDays] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedNavPermissions, setSelectedNavPermissions] = useState<string[]>([]);
    const [navSearchTerm, setNavSearchTerm] = useState<string>("");
    const [navItems, setNavItems] = useState(defaultNavItems);

    // 檢查用戶是否有權限訪問設定頁面
    const hasSettingsPermission = useMemo(() => {
        if (!userRoles) return false;
        return userRoles.some(role => ['owner', 'admin'].includes(role));
    }, [userRoles]);

    // 確保所有預設類別都存在
    const defaultCategories = useMemo(() => 
        [
            '儀表板管理',
            '專案管理',
            '工作包管理',
            '財務管理',
            '用戶管理',
            '系統管理',
            '通知管理',
            '行程管理',
            '日曆管理',
            '估價單管理',
            '合約管理',
            '訂單管理',
            '支出管理',
            'Gemini管理',
            '封存管理'
        ],
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
            setIsLoading(false);
        }
        fetchRetentionDays();
    }, [user]);

    // 載入導航權限設定
    useEffect(() => {
        async function fetchNavPermissions() {
            if (!user) return;
            
            try {
                const navPermissionsDoc = doc(db, 'settings', 'navPermissions');
                const snapshot = await getDoc(navPermissionsDoc);
                
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    setNavItems(data.items || defaultNavItems);
                }
            } catch (error) {
                console.error('載入導航權限設定失敗:', error);
            }
        }
        fetchNavPermissions();
    }, [user]);

    // 根據類別分組權限
    const groupedPermissions = useMemo(() => {
        return permissions.reduce((groups, permission) => {
            const category = permission.category;
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(permission);
            return groups;
        }, {} as Record<string, UnifiedPermission[]>);
    }, [permissions]);

    // 處理封存天數更新
    const handleRetentionDaysUpdate = async () => {
        if (!user) return;
        
        try {
            setIsUpdating(true);
            await setDoc(doc(db, 'settings', 'archive'), {
                retentionDays: tempRetentionDays,
                lastUpdatedBy: user.uid,
                lastUpdatedAt: new Date().toISOString()
            }, { merge: true });
            
            setArchiveRetentionDays(tempRetentionDays);
            setIsEditingRetentionDays(false);
            alert('封存天數設定已更新');
        } catch (error) {
            console.error('更新封存天數失敗:', error);
            alert('更新封存天數失敗，請稍後再試');
        } finally {
            setIsUpdating(false);
        }
    };

    // 處理導航權限更新
    const handleNavPermissionUpdate = async () => {
        if (!user || selectedRoles.length === 0) return;
        
        try {
            setIsUpdating(true);
            const updatedItems = navItems.map(item => ({
                ...item,
                defaultRoles: selectedNavPermissions.includes(item.id) 
                    ? [...new Set([...item.defaultRoles, ...selectedRoles as Role[]])]
                    : item.defaultRoles.filter(role => !selectedRoles.includes(role as Role))
            }));

            // 更新 Firestore 中的導航權限設定
            await setDoc(doc(db, 'settings', 'navPermissions'), {
                items: updatedItems,
                lastUpdatedBy: user.uid,
                lastUpdatedAt: new Date().toISOString()
            }, { merge: true });
            
            // 更新本地狀態
            setNavItems(updatedItems);

            // 更新 Custom Claims
            for (const role of selectedRoles) {
                await fetch('/api/auth/role', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        uid: user.uid,
                        role: role as Role,
                        action: 'set'
                    })
                });
            }

            // 強制重新獲取 token 以更新 custom claims
            await user.getIdToken(true);
            
            alert('導航權限設定已更新');
        } catch (error) {
            console.error('更新導航權限失敗:', error);
            alert('更新導航權限失敗，請稍後再試');
        } finally {
            setIsUpdating(false);
        }
    };

    // 處理角色選擇
    const handleRoleSelect = (roles: Role[]) => {
        setSelectedRoles(roles);
        
        if (!permissions) return;
        
        // 合併所有選中角色的權限
        const combinedPermissions = roles.flatMap(role => {
            const rolePermissions = permissions.filter(p => p.roles?.includes(role));
            return rolePermissions.map(p => p.id);
        });
        setSelectedPermissions([...new Set(combinedPermissions)]);
        
        // 更新導航權限
        const combinedNavPermissions = roles.flatMap(role => 
            navItems
                .filter(item => item.defaultRoles.includes(role as Role))
                .map(item => item.id)
        );
        setSelectedNavPermissions([...new Set(combinedNavPermissions)]);
    };

    // 切換類別展開狀態
    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    // 初始化時展開所有類別
    useEffect(() => {
        setExpandedCategories(new Set(defaultCategories));
    }, [defaultCategories]);

    // 處理權限更新
    const handlePermissionUpdate = async () => {
        if (selectedRoles.length === 0) return;
        
        try {
            setIsUpdating(true);
            const success = await updatePermissions(selectedRoles, selectedPermissions);
            
            if (success) {
                alert(`已更新 ${selectedRoles.join(', ')} 的權限設定`);
            } else {
                alert('更新權限失敗，請稍後再試');
            }
        } catch (error) {
            console.error('更新權限失敗:', error);
            alert('更新權限失敗，請稍後再試');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading || permissionsLoading) return <main className="p-6 pb-24 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">載入中...</main>;
    if (error) return <main className="p-6 pb-24 text-red-500">錯誤：{error.message}</main>;
    if (!hasSettingsPermission) {
        return (
            <main className="p-6 pb-24 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h1 className="text-2xl font-bold mb-2">存取被拒絕</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        您沒有權限訪問此頁面。此頁面僅供系統管理員使用。
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="p-6 pb-24 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">系統設定</h1>

                {/* 封存設定區塊 */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
                    <h2 className="text-xl font-semibold mb-4">封存設定</h2>
                    <div className="flex items-center gap-4">
                        {isEditingRetentionDays ? (
                            <>
                                <input
                                    type="number"
                                    value={tempRetentionDays || ''}
                                    onChange={(e) => setTempRetentionDays(Number(e.target.value))}
                                    className="border rounded px-3 py-2 w-32"
                                    min="0"
                                />
                                <button
                                    onClick={handleRetentionDaysUpdate}
                                    disabled={isUpdating}
                                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                                >
                                    {isUpdating ? '更新中...' : '儲存'}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditingRetentionDays(false);
                                        setTempRetentionDays(archiveRetentionDays);
                                    }}
                                    className="text-gray-600 hover:text-gray-800"
                                >
                                    取消
                                </button>
                            </>
                        ) : (
                            <>
                                <span className="text-lg">
                                    自動刪除天數：{archiveRetentionDays ?? '未設定'}
                                </span>
                                <button
                                    onClick={() => {
                                        setIsEditingRetentionDays(true);
                                        setTempRetentionDays(archiveRetentionDays);
                                    }}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    編輯
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* 權限管理區塊 */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* 左側：角色選擇和權限設定 */}
                    <div className="lg:col-span-8">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                            <h2 className="text-xl font-semibold mb-4">角色權限管理</h2>
                            
                            {/* 角色選擇 */}
                            <div className="mb-6">
                                <h3 className="text-lg font-medium mb-2">選擇角色</h3>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(ROLE_NAMES).map(([role, name]) => (
                                        <button
                                            key={role}
                                            onClick={() => handleRoleSelect([role as Role])}
                                            className={`px-3 py-1.5 rounded-lg text-sm border transition-all duration-200 ${
                                                selectedRoles.includes(role as Role)
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-800'
                                            }`}
                                        >
                                            {name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 權限搜尋 */}
                            <div className="mb-6">
                                <input
                                    type="text"
                                    placeholder="搜尋權限..."
                                    className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* 權限列表 */}
                            {selectedRoles.length > 0 ? (
                                <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto">
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
                                    <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
                                        <button
                                            onClick={handlePermissionUpdate}
                                            disabled={isUpdating}
                                            className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                                        >
                                            {isUpdating ? (
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
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    請從上方選擇一個或多個角色來管理權限
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 右側：導航權限設定 */}
                    <div className="lg:col-span-4">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                            <h2 className="text-xl font-semibold mb-4">導航權限設定</h2>
                            
                            {/* 導航項目搜尋 */}
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="搜尋導航項目..."
                                    className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700"
                                    value={navSearchTerm}
                                    onChange={(e) => setNavSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* 導航項目列表 */}
                            <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
                                {navItems
                                    .filter(item => 
                                        item.name.toLowerCase().includes(navSearchTerm.toLowerCase()) ||
                                        item.description.toLowerCase().includes(navSearchTerm.toLowerCase())
                                    )
                                    .map(item => (
                                        <div key={item.id} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                                            <input
                                                type="checkbox"
                                                id={`nav-${item.id}`}
                                                checked={selectedNavPermissions.includes(item.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedNavPermissions([...selectedNavPermissions, item.id]);
                                                    } else {
                                                        setSelectedNavPermissions(selectedNavPermissions.filter(id => id !== item.id));
                                                    }
                                                }}
                                                className="mr-2"
                                            />
                                            <label htmlFor={`nav-${item.id}`} className="text-sm">
                                                {item.name}
                                                <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">
                                                    ({item.description})
                                                </span>
                                            </label>
                                        </div>
                                    ))}
                            </div>

                            {/* 更新按鈕 */}
                            <button
                                onClick={handleNavPermissionUpdate}
                                disabled={isUpdating || selectedRoles.length === 0}
                                className="mt-6 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed w-full flex items-center justify-center"
                            >
                                {isUpdating ? (
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
                                        更新導航權限設定
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
