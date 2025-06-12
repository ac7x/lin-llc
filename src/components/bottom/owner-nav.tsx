'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useMemo } from 'react';
import { useUserRole } from '@/hooks/useUserRole';

interface NavItem {
    href: string;
    icon: ReactNode;
    label: string;
    active: boolean;
    requiredRoles?: string[];
    minRole?: string;
}

interface OwnerBottomNavProps {
    items?: NavItem[];
}

const defaultOwnerNavItems: NavItem[] = [
    // 核心管理
    { 
        href: '/owner/dashboard', 
        icon: '📊', 
        label: '儀表板', 
        active: false,
        requiredRoles: ['owner'], // 僅 owner 可見
    },
    
    // 專案管理
    { 
        href: '/owner/projects', 
        icon: '📁', 
        label: '專案', 
        active: false,
        requiredRoles: ['admin', 'owner', 'foreman', 'coord'],
    },
    { 
        href: '/owner/schedule', 
        icon: '📅', 
        label: '行程', 
        active: false,
        requiredRoles: ['admin', 'owner', 'foreman', 'coord'],
    },
    { 
        href: '/owner/calendar', 
        icon: '🗓️', 
        label: '日曆', 
        active: false,
        requiredRoles: ['admin', 'owner', 'foreman', 'coord'],
    },

    // 財務相關
    { 
        href: '/owner/contracts', 
        icon: '📑', 
        label: '合約', 
        active: false,
        requiredRoles: ['owner', 'finance'],
    },
    { 
        href: '/owner/quotes', 
        icon: '📄', 
        label: '估價單', 
        active: false,
        requiredRoles: ['owner', 'finance'],
    },
    { 
        href: '/owner/orders', 
        icon: '🧾', 
        label: '訂單', 
        active: false,
        requiredRoles: ['owner', 'finance'],
    },
    { 
        href: '/owner/invoices', 
        icon: '🧾', 
        label: '發票', 
        active: false,
        requiredRoles: ['owner', 'finance'],
    },

    // 系統管理
    { 
        href: '/owner/users', 
        icon: '👤', 
        label: '用戶管理', 
        active: false,
        requiredRoles: ['owner'], // 僅 owner 可見
    },
    { 
        href: '/owner/settings', 
        icon: '⚙️', 
        label: '設定', 
        active: false,
        requiredRoles: ['owner'],
    },
    { 
        href: '/owner/archive', 
        icon: '🗄️', 
        label: '封存', 
        active: false,
        requiredRoles: ['owner'], // 僅 owner 可見
    },
    { 
        href: '/owner/gemini', 
        icon: '🤖', 
        label: 'Gemini', 
        active: false,
        minRole: 'user',
    },
    { 
        href: '/owner/profile', 
        icon: '🙍‍♂️', 
        label: '個人檔案', 
        active: false,
        minRole: 'user',
    },
];

export function OwnerBottomNav({ items = defaultOwnerNavItems }: OwnerBottomNavProps) {
    const pathname = usePathname();
    const { hasAnyRole, hasMinRole, loading } = useUserRole();

    const filteredNavItems = useMemo(() => {
        return (items.length > 0 ? items : defaultOwnerNavItems)
            .filter(item => {
                // 如果有指定 requiredRoles，檢查用戶是否擁有其中任一角色
                if (item.requiredRoles && item.requiredRoles.length > 0) {
                    return hasAnyRole(item.requiredRoles);
                }
                
                // 如果有指定 minRole，檢查用戶角色層級是否足夠
                if (item.minRole) {
                    return hasMinRole(item.minRole);
                }
                
                // 預設允許
                return true;
            })
            .map(item => ({
                ...item,
                active: pathname === item.href,
            }));
    }, [items, hasAnyRole, hasMinRole, pathname]);

    // 載入中或沒有可顯示項目時不渲染
    if (loading || filteredNavItems.length === 0) {
        return null;
    }

    return (
        <>
            <nav
                className="
                    fixed bottom-0 left-0 w-full h-16
                    bg-white border-t border-gray-200 dark:bg-gray-900 dark:border-gray-700
                    font-sans px-safe pb-safe
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
