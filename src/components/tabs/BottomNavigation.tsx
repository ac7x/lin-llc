'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useEffect } from 'react';
import type { ReactElement } from 'react';

import { navigationItems } from '@/constants/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { NavigationItem } from '@/types/navigation';
import { cn, longClassName } from '@/utils/classNameUtils';

export default function BottomNavigation(): ReactElement | null {
  const pathname = usePathname();
  const { user, hasPermission } = useAuth();
  const activeItemRef = useRef<HTMLLIElement>(null);

  const filteredNavigationItems = navigationItems.filter((item: NavigationItem) =>
    hasPermission(item.id)
  );

  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [pathname, filteredNavigationItems]);

  if (!user || filteredNavigationItems.length === 0) {
    return null;
  }

  // 使用 longClassName 來避免 Firebase Performance 錯誤
  const baseLinkClass = longClassName([
    'flex flex-col items-center justify-center w-20 h-full',
    'transition-colors duration-200'
  ]);

  const activeLinkClass = longClassName([
    'text-indigo-600 dark:text-indigo-400'
  ]);

  const inactiveLinkClass = longClassName([
    'text-gray-500 dark:text-gray-400',
    'hover:text-indigo-600 dark:hover:text-indigo-400'
  ]);

  return (
    <nav className={cn('fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-50 dark:bg-gray-800 dark:border-gray-700')}>
      <div
        className={cn('flex justify-center overflow-x-auto scrollbar-hide h-full items-center')}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <ul className={cn('flex h-full')}>
          {filteredNavigationItems.map((item: NavigationItem) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <li key={item.id} ref={isActive ? activeItemRef : null} className={cn('flex-shrink-0')}>
                <Link
                  href={item.path}
                  className={cn(
                    baseLinkClass,
                    isActive ? activeLinkClass : inactiveLinkClass
                  )}
                >
                  <span className={cn('flex-shrink-0')}>{item.icon}</span>
                  <span className={cn('text-xs mt-1')}>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
