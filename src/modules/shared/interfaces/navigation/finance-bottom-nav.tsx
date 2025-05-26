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

interface FinanceBottomNavProps {
  items?: NavItem[];
}

const defaultFinanceNavItems: NavItem[] = [
  { href: '/finance/work-archived', icon: '🗃️', label: '資產管理', active: false },
  { href: '/finance/work-asset', icon: '🏗️', label: '資產管理', active: false },
];

export function FinanceBottomNav({ items = defaultFinanceNavItems }: FinanceBottomNavProps) {
  const pathname = usePathname();

  const navItems = (items && items.length > 0 ? items : defaultFinanceNavItems).map(item => ({
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
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex h-full mx-auto justify-center items-center overflow-x-visible w-full">
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
                : 'text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400'
              }
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