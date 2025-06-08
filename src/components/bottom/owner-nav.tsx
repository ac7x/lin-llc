'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface NavItem {
    href: string;
    icon: ReactNode;
    label: string;
    active: boolean;
}

interface OwnerBottomNavProps {
    items?: NavItem[];
}

const defaultOwnerNavItems: NavItem[] = [
    { href: '/owner/dashboard', icon: '📊', label: '儀表板', active: false },
    { href: '/owner/projects', icon: '📁', label: '專案', active: false },
    { href: '/owner/schedule', icon: '📅', label: '行程', active: false },
    { href: '/owner/calendar', icon: '🗓️', label: '日曆', active: false },
    { href: '/owner/contracts', icon: '📑', label: '合約', active: false },
    { href: '/owner/quotes', icon: '📄', label: '估價單', active: false },
    { href: '/owner/orders', icon: '🧾', label: '訂單', active: false },
    { href: '/owner/users', icon: '👤', label: '用戶管理', active: false },
    { href: '/owner/notifications', icon: '🔔', label: '通知', active: false },
    { href: '/shared/signin', icon: '🙍‍♂️', label: '個人檔案', active: false },
    { href: '/owner/settings', icon: '⚙️', label: '設定', active: false },
    { href: '/owner/archive', icon: '🗄️', label: '封存', active: false },
];

export function OwnerBottomNav({ items = defaultOwnerNavItems }: OwnerBottomNavProps) {
    const pathname = usePathname();

    const navItems = (items.length > 0 ? items : defaultOwnerNavItems).map(item => ({
        ...item,
        active: pathname === item.href,
    }));

    return (
        <nav
            className="
        fixed bottom-0 left-0 z-50 w-full h-16
        bg-white border-t border-gray-200 dark:bg-gray-900 dark:border-gray-700
        font-sans px-safe pb-safe
      "
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="flex h-full mx-auto items-center w-full overflow-x-auto whitespace-nowrap justify-center">
                {navItems.map((item, index) => (
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
    );
}
