/**
 * 底部導航組件
 * 提供系統主要功能的導航介面
 * 支援基於用戶角色的動態導航項目
 * 整合權限控制和路由導航
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useMemo, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
    href: string;
    icon: ReactNode;
    label: string;
    active: boolean;
}

interface OwnerBottomNavProps {
    items?: NavItem[];
}

interface NavPermission {
    id: string;
    name: string;
    description: string;
    defaultRoles: string[];
}

const defaultOwnerNavItems: NavItem[] = [
    // 個人相關
    { 
        href: '/profile', 
        icon: '🙍‍♂️', 
        label: '個人檔案', 
        active: false,
    },
    { 
        href: '/dashboard', 
        icon: '📊', 
        label: '儀表板', 
        active: false,
    },

    // 專案管理
    { 
        href: '/projects', 
        icon: '📁', 
        label: '專案', 
        active: false,
    },
    { 
        href: '/schedule', 
        icon: '📅', 
        label: '行程', 
        active: false,
    },
    { 
        href: '/calendar', 
        icon: '🗓️', 
        label: '日曆', 
        active: false,
    },

    // 財務管理
    { 
        href: '/quotes', 
        icon: '📄', 
        label: '估價單', 
        active: false,
    },
    { 
        href: '/contracts', 
        icon: '📑', 
        label: '合約', 
        active: false,
    },
    { 
        href: '/orders', 
        icon: '🧾', 
        label: '訂單', 
        active: false,
    },

    // 系統功能
    { 
        href: '/gemini', 
        icon: '🤖', 
        label: 'Gemini', 
        active: false,
    },
    { 
        href: '/notifications', 
        icon: '🔔', 
        label: '通知', 
        active: false,
    },
    { 
        href: '/send-notification', 
        icon: '📨', 
        label: '發送通知', 
        active: false,
    },
    { 
        href: '/users', 
        icon: '👤', 
        label: '用戶管理', 
        active: false,
    },
    { 
        href: '/settings', 
        icon: '⚙️', 
        label: '設定', 
        active: false,
    },
    { 
        href: '/archive', 
        icon: '🗄️', 
        label: '封存', 
        active: false,
    },
];

export function OwnerBottomNav({ items = defaultOwnerNavItems }: OwnerBottomNavProps) {
    const pathname = usePathname();
    const { loading, userRoles, db, doc, getDoc } = useAuth();
    const [navPermissions, setNavPermissions] = useState<NavPermission[]>([]);

    // 載入導航權限設定
    useEffect(() => {
        async function fetchNavPermissions() {
            try {
                const navPermissionsDoc = doc(db, 'settings', 'navPermissions');
                const navPermissionsSnapshot = await getDoc(navPermissionsDoc);
                
                if (navPermissionsSnapshot.exists()) {
                    const loadedNavPermissions = navPermissionsSnapshot.data().permissions || [];
                    setNavPermissions(loadedNavPermissions);
                }
            } catch (error) {
                console.error('載入導航權限設定失敗:', error);
            }
        }
        fetchNavPermissions();
    }, [db, doc, getDoc]);

    const filteredNavItems = useMemo(() => {
        return (items.length > 0 ? items : defaultOwnerNavItems)
            .filter(item => {
                // 從路徑中提取ID
                const itemId = item.href.split('/').pop();
                
                // 檢查是否有自定義導航權限設定
                const navPermission = navPermissions.find(np => np.id === itemId);
                if (navPermission) {
                    // 如果有自定義設定，檢查用戶角色是否在允許的角色列表中
                    return userRoles.some((role: string) => navPermission.defaultRoles.includes(role));
                }
                
                return true;
            })
            .map(item => ({
                ...item,
                active: pathname === item.href,
            }));
    }, [items, pathname, navPermissions, userRoles]);

    // 載入中或沒有可顯示項目時不渲染
    if (loading || filteredNavItems.length === 0) {
        return null;
    }

    return (
        <>
            <nav
                className="
                    fixed bottom-0 left-0 right-0 w-full h-16
                    bg-white border-t border-gray-200 dark:bg-gray-900 dark:border-gray-700
                    font-sans px-safe pb-safe z-50
                "
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <div className="flex h-full mx-auto items-center w-full overflow-x-auto whitespace-nowrap justify-center">
                    {filteredNavItems.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href}
                            className={`
                                flex-1 min-w-0 inline-flex flex-col items-center justify-center h-full
                                px-2 sm:px-5 max-w-[120px]
                                transition-colors duration-150
                                ${item.active
                                    ? 'text-green-600 font-semibold border-t-2 border-green-600 bg-green-50 dark:bg-green-900 dark:text-green-400 dark:border-green-400'
                                    : 'text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400'}
                            `}
                            style={{ minWidth: '76px' }}
                        >
                            <div className="text-xl sm:text-2xl">{item.icon}</div>
                            <span className="text-[11px] sm:text-xs truncate block">{item.label}</span>
                        </Link>
                    ))}
                </div>
            </nav>
        </>
    );
}
