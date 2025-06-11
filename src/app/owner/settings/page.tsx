"use client";

import { useState, useEffect, useCallback } from 'react';
import { useFirebase } from "@/hooks/useFirebase";
import { useUserRole } from "@/hooks/useUserRole";
import { ROLE_HIERARCHY } from "@/utils/roleHierarchy";

// 定義權限類型
interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

// 定義角色權限設定
interface RolePermission {
  role: string;
  permissions: string[];
}

// 預設權限列表
const DEFAULT_PERMISSIONS: Permission[] = [
  // 專案管理權限
  { id: 'project.view', name: '查看專案', description: '允許查看專案列表和詳情', category: '專案管理' },
  { id: 'project.create', name: '建立專案', description: '允許建立新專案', category: '專案管理' },
  { id: 'project.edit', name: '編輯專案', description: '允許編輯專案資訊', category: '專案管理' },
  { id: 'project.delete', name: '刪除專案', description: '允許刪除專案', category: '專案管理' },
  
  // 工作包管理權限
  { id: 'workpackage.view', name: '查看工作包', description: '允許查看工作包列表和詳情', category: '工作包管理' },
  { id: 'workpackage.create', name: '建立工作包', description: '允許建立新工作包', category: '工作包管理' },
  { id: 'workpackage.edit', name: '編輯工作包', description: '允許編輯工作包資訊', category: '工作包管理' },
  { id: 'workpackage.delete', name: '刪除工作包', description: '允許刪除工作包', category: '工作包管理' },
  
  // 財務管理權限
  { id: 'finance.view', name: '查看財務', description: '允許查看財務相關資訊', category: '財務管理' },
  { id: 'finance.create', name: '建立財務記錄', description: '允許建立財務記錄', category: '財務管理' },
  { id: 'finance.edit', name: '編輯財務記錄', description: '允許編輯財務記錄', category: '財務管理' },
  { id: 'finance.delete', name: '刪除財務記錄', description: '允許刪除財務記錄', category: '財務管理' },
  
  // 用戶管理權限
  { id: 'user.view', name: '查看用戶', description: '允許查看用戶列表和詳情', category: '用戶管理' },
  { id: 'user.create', name: '建立用戶', description: '允許建立新用戶', category: '用戶管理' },
  { id: 'user.edit', name: '編輯用戶', description: '允許編輯用戶資訊', category: '用戶管理' },
  { id: 'user.delete', name: '刪除用戶', description: '允許刪除用戶', category: '用戶管理' },
  
  // 系統管理權限
  { id: 'system.view', name: '查看系統設定', description: '允許查看系統設定', category: '系統管理' },
  { id: 'system.edit', name: '編輯系統設定', description: '允許編輯系統設定', category: '系統管理' },
];

export default function OwnerSettingsPage() {
    const { db, doc, getDoc, setDoc } = useFirebase();
    const { isOwner } = useUserRole();
    const [archiveRetentionDays, setArchiveRetentionDaysState] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    
    // 權限管理相關狀態
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
    const [selectedRoleForPermission, setSelectedRoleForPermission] = useState<string>("");
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

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

    // 根據角色獲取預設權限
    const getDefaultPermissionsForRole = useCallback((role: string): string[] => {
        const basePermissions = ['project.view', 'workpackage.view'];
        
        switch (role) {
            case 'owner':
                return DEFAULT_PERMISSIONS.map(p => p.id);
            case 'admin':
                return DEFAULT_PERMISSIONS
                    .filter(p => !p.id.includes('system.'))
                    .map(p => p.id);
            case 'finance':
                return [...basePermissions, 'finance.view', 'finance.create', 'finance.edit'];
            case 'foreman':
                return [...basePermissions, 'workpackage.create', 'workpackage.edit'];
            case 'coord':
                return [...basePermissions, 'workpackage.create', 'workpackage.edit'];
            case 'safety':
                return [...basePermissions, 'workpackage.view'];
            case 'vendor':
                return [...basePermissions, 'workpackage.view'];
            case 'helper':
                return [...basePermissions];
            case 'temporary':
                return [...basePermissions];
            case 'user':
                return [...basePermissions];
            default:
                return basePermissions;
        }
    }, []);

    // 初始化權限設定
    const initializePermissions = useCallback(async () => {
        try {
            const permissionsRef = doc(db, 'settings', 'permissions');
            const permissionsSnapshot = await getDoc(permissionsRef);
            
            if (!permissionsSnapshot.exists()) {
                await setDoc(permissionsRef, { permissions: DEFAULT_PERMISSIONS });
                setPermissions(DEFAULT_PERMISSIONS);
            }

            const rolePermissionsRef = doc(db, 'settings', 'rolePermissions');
            const rolePermissionsSnapshot = await getDoc(rolePermissionsRef);
            
            if (!rolePermissionsSnapshot.exists()) {
                const initialRolePermissions = Object.keys(ROLE_HIERARCHY).map(role => ({
                    role,
                    permissions: getDefaultPermissionsForRole(role)
                }));
                await setDoc(rolePermissionsRef, { roles: initialRolePermissions });
                setRolePermissions(initialRolePermissions);
            }
        } catch (error) {
            console.error('初始化權限設定失敗:', error);
        }
    }, [db, doc, getDoc, setDoc, getDefaultPermissionsForRole]);

    // 載入權限設定
    useEffect(() => {
        async function fetchPermissions() {
            const rolePermissionsDoc = doc(db, 'settings', 'rolePermissions');
            const rolePermissionsSnapshot = await getDoc(rolePermissionsDoc);
            if (rolePermissionsSnapshot.exists()) {
                setRolePermissions(rolePermissionsSnapshot.data().roles || []);
            } else {
                await initializePermissions();
            }
        }
        fetchPermissions();
    }, [db, doc, getDoc, initializePermissions]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (archiveRetentionDays && archiveRetentionDays > 0) {
            await setDoc(doc(db, 'settings', 'archive'), { retentionDays: archiveRetentionDays }, { merge: true });
            alert(`已設定封存自動刪除天數為 ${archiveRetentionDays} 天`);
        }
    };

    // 處理權限更新
    const handlePermissionUpdate = async () => {
        if (!selectedRoleForPermission || !isOwner) return;
        
        try {
            setUpdating(true);
            const rolePermissionsRef = doc(db, 'settings', 'rolePermissions');
            const updatedRoles = rolePermissions.map((rp: RolePermission) => 
                rp.role === selectedRoleForPermission 
                    ? { ...rp, permissions: selectedPermissions }
                    : rp
            );
            
            await setDoc(rolePermissionsRef, { roles: updatedRoles }, { merge: true });
            setRolePermissions(updatedRoles);
            alert(`已更新 ${selectedRoleForPermission} 的權限設定`);
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
        const rolePermission = rolePermissions.find((rp: RolePermission) => rp.role === role);
        setSelectedPermissions(rolePermission?.permissions || []);
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
                            <label className="block font-medium mb-1">選擇角色</label>
                            <select
                                className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700"
                                value={selectedRoleForPermission}
                                onChange={(e) => handleRoleSelect(e.target.value)}
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
                        </div>

                        {selectedRoleForPermission && (
                            <div>
                                <label className="block font-medium mb-1">權限設定</label>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {permissions.map(permission => (
                                        <div key={permission.id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={permission.id}
                                                checked={selectedPermissions.includes(permission.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedPermissions([...selectedPermissions, permission.id]);
                                                    } else {
                                                        setSelectedPermissions(selectedPermissions.filter(id => id !== permission.id));
                                                    }
                                                }}
                                                className="mr-2"
                                            />
                                            <label htmlFor={permission.id} className="text-sm">
                                                {permission.name}
                                                <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">
                                                    ({permission.description})
                                                </span>
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handlePermissionUpdate}
                                    disabled={updating}
                                    className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed w-full"
                                >
                                    {updating ? '更新中...' : '更新權限設定'}
                                </button>
                            </div>
                        )}

                        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded">
                            <h3 className="font-medium mb-2">權限說明</h3>
                            <div className="space-y-2 text-sm">
                                {permissions.map(permission => (
                                    <div key={permission.id} className="flex justify-between">
                                        <span>{permission.name}</span>
                                        <span className="text-gray-500 dark:text-gray-400">{permission.category}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
