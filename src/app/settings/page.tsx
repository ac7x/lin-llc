"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_HIERARCHY } from "@/utils/roleHierarchy";
import { db } from "@/lib/firebase-client";
import { doc, getDoc, setDoc } from "firebase/firestore";

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

// 定義導航項目權限類型
interface NavPermission {
  id: string;
  name: string;
  description: string;
  defaultRoles: string[];
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

  // 通知管理權限
  { id: 'notification.view', name: '查看通知', description: '允許查看系統通知', category: '通知管理' },
  { id: 'notification.create', name: '建立通知', description: '允許建立新的系統通知', category: '通知管理' },
  { id: 'notification.edit', name: '編輯通知', description: '允許編輯系統通知', category: '通知管理' },
  { id: 'notification.delete', name: '刪除通知', description: '允許刪除系統通知', category: '通知管理' },
  { id: 'notification.settings', name: '通知設定', description: '允許管理通知設定和偏好', category: '通知管理' },
];

// 預設導航權限列表
const DEFAULT_NAV_PERMISSIONS: NavPermission[] = [
  { 
    id: 'profile', 
    name: '個人檔案', 
    description: '允許訪問個人檔案頁面', 
    defaultRoles: ['user'] 
  },
  { 
    id: 'dashboard', 
    name: '儀表板', 
    description: '允許訪問儀表板頁面', 
    defaultRoles: ['owner'] 
  },
  { 
    id: 'projects', 
    name: '專案', 
    description: '允許訪問專案管理頁面', 
    defaultRoles: ['admin', 'owner', 'foreman', 'coord'] 
  },
  { 
    id: 'schedule', 
    name: '行程', 
    description: '允許訪問行程管理頁面', 
    defaultRoles: ['admin', 'owner', 'foreman', 'coord'] 
  },
  { 
    id: 'calendar', 
    name: '日曆', 
    description: '允許訪問日曆頁面', 
    defaultRoles: ['admin', 'owner', 'foreman', 'coord'] 
  },
  { 
    id: 'quotes', 
    name: '估價單', 
    description: '允許訪問估價單頁面', 
    defaultRoles: ['owner', 'finance'] 
  },
  { 
    id: 'contracts', 
    name: '合約', 
    description: '允許訪問合約頁面', 
    defaultRoles: ['owner', 'finance'] 
  },
  { 
    id: 'orders', 
    name: '訂單', 
    description: '允許訪問訂單頁面', 
    defaultRoles: ['owner', 'finance'] 
  },
  { 
    id: 'expenses', 
    name: '支出', 
    description: '允許訪問支出頁面', 
    defaultRoles: ['owner', 'finance'] 
  },
  { 
    id: 'gemini', 
    name: 'Gemini', 
    description: '允許訪問Gemini頁面', 
    defaultRoles: ['user'] 
  },
  { 
    id: 'notifications', 
    name: '通知', 
    description: '允許訪問通知頁面', 
    defaultRoles: ['user'] 
  },
  { 
    id: 'send-notification', 
    name: '發送通知', 
    description: '允許訪問發送通知頁面', 
    defaultRoles: ['owner', 'admin'] 
  },
  { 
    id: 'users', 
    name: '用戶管理', 
    description: '允許訪問用戶管理頁面', 
    defaultRoles: ['owner'] 
  },
  { 
    id: 'settings', 
    name: '設定', 
    description: '允許訪問設定頁面', 
    defaultRoles: ['owner'] 
  },
  { 
    id: 'archive', 
    name: '封存', 
    description: '允許訪問封存頁面', 
    defaultRoles: ['owner'] 
  },
];

export default function OwnerSettingsPage() {
    const { user, isOwner } = useAuth();
    const router = useRouter();
    const [archiveRetentionDays, setArchiveRetentionDaysState] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [isEditingRetentionDays, setIsEditingRetentionDays] = useState(false);
    const [tempRetentionDays, setTempRetentionDays] = useState<number | null>(null);
    
    // 權限管理相關狀態
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
    const [selectedRoleForPermission, setSelectedRoleForPermission] = useState<string>("");
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    // 導航權限相關狀態
    const [navPermissions, setNavPermissions] = useState<NavPermission[]>([]);
    const [selectedNavPermissions, setSelectedNavPermissions] = useState<string[]>([]);
    const [navSearchTerm, setNavSearchTerm] = useState<string>("");

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
                setArchiveRetentionDaysState(typeof data.retentionDays === 'number' ? data.retentionDays : null);
            } else {
                setArchiveRetentionDaysState(null);
            }
            setLoading(false);
        }
        fetchRetentionDays();
    }, [user]);

    // 根據角色獲取預設權限
    const getDefaultPermissionsForRole = useCallback((role: string): string[] => {
        const basePermissions = ['project.view', 'workpackage.view'];
        const notificationBasePermissions = ['notification.view'];
        
        switch (role) {
            case 'owner':
                return DEFAULT_PERMISSIONS.map(p => p.id);
            case 'admin':
                return [
                    ...DEFAULT_PERMISSIONS
                        .filter(p => !p.id.includes('system.'))
                        .map(p => p.id),
                    'notification.settings'
                ];
            case 'finance':
                return [
                    ...basePermissions, 
                    'finance.view', 
                    'finance.create', 
                    'finance.edit',
                    ...notificationBasePermissions
                ];
            case 'foreman':
                return [
                    ...basePermissions, 
                    'workpackage.create', 
                    'workpackage.edit',
                    ...notificationBasePermissions,
                    'notification.create'
                ];
            case 'coord':
                return [
                    ...basePermissions, 
                    'workpackage.create', 
                    'workpackage.edit',
                    ...notificationBasePermissions,
                    'notification.create'
                ];
            case 'safety':
                return [
                    ...basePermissions, 
                    'workpackage.view',
                    ...notificationBasePermissions,
                    'notification.create'
                ];
            case 'vendor':
                return [
                    ...basePermissions, 
                    'workpackage.view',
                    ...notificationBasePermissions
                ];
            case 'helper':
                return [
                    ...basePermissions,
                    ...notificationBasePermissions
                ];
            case 'temporary':
                return [
                    ...basePermissions,
                    ...notificationBasePermissions
                ];
            case 'user':
                return [
                    ...basePermissions,
                    ...notificationBasePermissions
                ];
            default:
                return [...basePermissions, ...notificationBasePermissions];
        }
    }, []);

    // 初始化權限設定
    const initializePermissions = useCallback(async () => {
        try {
            console.log('開始初始化權限...');
            console.log('預設權限列表:', DEFAULT_PERMISSIONS);

            // 強制重置權限設定
            const permissionsRef = doc(db, 'settings', 'permissions');
            await setDoc(permissionsRef, { permissions: DEFAULT_PERMISSIONS });
            setPermissions(DEFAULT_PERMISSIONS);

            const rolePermissionsRef = doc(db, 'settings', 'rolePermissions');
            const initialRolePermissions = Object.keys(ROLE_HIERARCHY).map(role => ({
                role,
                permissions: getDefaultPermissionsForRole(role)
            }));
            await setDoc(rolePermissionsRef, { roles: initialRolePermissions });
            setRolePermissions(initialRolePermissions);

            console.log('權限初始化完成');
            console.log('設置的權限:', DEFAULT_PERMISSIONS);
            console.log('設置的角色權限:', initialRolePermissions);
        } catch (error) {
            console.error('初始化權限設定失敗:', error);
            // 如果初始化失敗，至少設置預設權限
            setPermissions(DEFAULT_PERMISSIONS);
            const initialRolePermissions = Object.keys(ROLE_HIERARCHY).map(role => ({
                role,
                permissions: getDefaultPermissionsForRole(role)
            }));
            setRolePermissions(initialRolePermissions);
        }
    }, [getDefaultPermissionsForRole]);

    // 載入權限設定
    useEffect(() => {
        async function fetchPermissions() {
            try {
                console.log('開始載入權限...');
                
                // 載入權限列表
                const permissionsDoc = doc(db, 'settings', 'permissions');
                const permissionsSnapshot = await getDoc(permissionsDoc);
                
                if (permissionsSnapshot.exists()) {
                    const loadedPermissions = permissionsSnapshot.data().permissions || [];
                    console.log('從資料庫載入的權限:', loadedPermissions);
                    setPermissions(loadedPermissions);
                } else {
                    console.log('權限不存在，開始初始化...');
                    await initializePermissions();
                }

                // 載入角色權限設定
                const rolePermissionsDoc = doc(db, 'settings', 'rolePermissions');
                const rolePermissionsSnapshot = await getDoc(rolePermissionsDoc);
                
                if (rolePermissionsSnapshot.exists()) {
                    const loadedRolePermissions = rolePermissionsSnapshot.data().roles || [];
                    console.log('從資料庫載入的角色權限:', loadedRolePermissions);
                    setRolePermissions(loadedRolePermissions);
                } else {
                    console.log('角色權限不存在，開始初始化...');
                    await initializePermissions();
                }
            } catch (error) {
                console.error('載入權限設定失敗:', error);
                console.log('嘗試使用預設權限...');
                await initializePermissions();
            }
        }
        fetchPermissions();
    }, [initializePermissions]);

    // 載入導航權限設定
    useEffect(() => {
        async function fetchNavPermissions() {
            try {
                const navPermissionsDoc = doc(db, 'settings', 'navPermissions');
                const navPermissionsSnapshot = await getDoc(navPermissionsDoc);
                
                if (navPermissionsSnapshot.exists()) {
                    const loadedNavPermissions = navPermissionsSnapshot.data().permissions || [];
                    setNavPermissions(loadedNavPermissions);
                } else {
                    // 如果不存在，使用預設值
                    setNavPermissions(DEFAULT_NAV_PERMISSIONS);
                    await setDoc(navPermissionsDoc, { permissions: DEFAULT_NAV_PERMISSIONS });
                }
            } catch (error) {
                console.error('載入導航權限設定失敗:', error);
                setNavPermissions(DEFAULT_NAV_PERMISSIONS);
            }
        }
        fetchNavPermissions();
    }, []);

    // 根據搜尋條件過濾權限
    const filteredPermissions = permissions.filter(permission => 
        permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 按類別分組權限
    const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
        if (!acc[permission.category]) {
            acc[permission.category] = [];
        }
        acc[permission.category].push(permission);
        return acc;
    }, {} as Record<string, Permission[]>);

    // 確保所有預設類別都存在，並包含其對應的權限
    const defaultCategories = useMemo(() => 
        ['專案管理', '工作包管理', '財務管理', '用戶管理', '系統管理', '通知管理'],
        []
    );
    defaultCategories.forEach(category => {
        if (!groupedPermissions[category]) {
            // 從預設權限中找出屬於該類別的權限
            const categoryPermissions = DEFAULT_PERMISSIONS.filter(p => p.category === category);
            groupedPermissions[category] = categoryPermissions;
        }
    });

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

    // 添加調試代碼來監視權限狀態
    useEffect(() => {
        console.log('當前權限列表:', permissions);
        console.log('當前角色權限:', rolePermissions);
        console.log('分組後的權限:', groupedPermissions);
        console.log('預設權限:', DEFAULT_PERMISSIONS);
    }, [permissions, rolePermissions, groupedPermissions]);

    // 初始化時展開所有類別
    useEffect(() => {
        setExpandedCategories(new Set(defaultCategories));
    }, [defaultCategories]);

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
            setArchiveRetentionDaysState(tempRetentionDays);
            setIsEditingRetentionDays(false);
        } catch (error) {
            console.error('更新封存天數失敗:', error);
            alert('更新封存天數失敗，請稍後再試');
        } finally {
            setUpdating(false);
        }
    };

    // 開始編輯封存天數
    const startEditingRetentionDays = () => {
        setTempRetentionDays(archiveRetentionDays);
        setIsEditingRetentionDays(true);
    };

    // 取消編輯封存天數
    const cancelEditingRetentionDays = () => {
        setTempRetentionDays(null);
        setIsEditingRetentionDays(false);
    };

    // 處理權限更新
    const handlePermissionUpdate = async () => {
        if (!selectedRoleForPermission || !user) return;
        
        try {
            setUpdating(true);
            const rolePermissionsRef = doc(db, 'settings', 'rolePermissions');
            const updatedRoles = rolePermissions.map((rp: RolePermission) => 
                rp.role === selectedRoleForPermission 
                    ? { ...rp, permissions: selectedPermissions }
                    : rp
            );
            
            await setDoc(rolePermissionsRef, { 
                roles: updatedRoles,
                lastUpdatedBy: user.uid,
                lastUpdatedAt: new Date().toISOString()
            }, { merge: true });
            setRolePermissions(updatedRoles);

            // 同時更新導航權限
            const navPermissionsRef = doc(db, 'settings', 'navPermissions');
            const updatedNavPermissions = navPermissions.map((np: NavPermission) => ({
                ...np,
                defaultRoles: selectedNavPermissions.includes(np.id) 
                    ? [...(np.defaultRoles || []), selectedRoleForPermission]
                    : (np.defaultRoles || []).filter(role => role !== selectedRoleForPermission)
            }));
            
            await setDoc(navPermissionsRef, { 
                permissions: updatedNavPermissions,
                lastUpdatedBy: user.uid,
                lastUpdatedAt: new Date().toISOString()
            }, { merge: true });
            setNavPermissions(updatedNavPermissions);
            
            alert(`已更新 ${selectedRoleForPermission} 的權限設定`);
            router.refresh(); // 重新整理頁面以更新導航
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
        
        // 更新選中的導航權限
        const roleNavPermissions = navPermissions
            .filter(np => np.defaultRoles.includes(role))
            .map(np => np.id);
        setSelectedNavPermissions(roleNavPermissions);
    };

    if (loading) return <main className="p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">載入中...</main>;
    if (!isOwner) return null; // 如果沒有權限，不顯示內容

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
                                        onClick={cancelEditingRetentionDays}
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
                                        onClick={startEditingRetentionDays}
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
                                    .map(([role, level]) => (
                                        <option key={role} value={role}>
                                            {role} (權限等級: {level})
                                        </option>
                                    ))
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
                                            <div key={category} className="border rounded-lg overflow-hidden">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleCategory(category)}
                                                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 flex justify-between items-center"
                                                >
                                                    <span className="font-medium">{category}</span>
                                                    <span>{expandedCategories.has(category) ? '▼' : '▶'}</span>
                                                </button>
                                                {expandedCategories.has(category) && (
                                                    <div className="p-4 space-y-2">
                                                        {perms.map(permission => (
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
                                                )}
                                            </div>
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
