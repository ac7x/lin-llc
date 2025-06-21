'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useEffect } from 'react';
import type { ReactElement } from 'react';

import { navigationItems } from '@/constants/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { NavigationItem } from '@/types/navigation';

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

  return (
    <nav className='fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-50 dark:bg-gray-800 dark:border-gray-700'>
      <div
        className='flex justify-center overflow-x-auto scrollbar-hide h-full items-center'
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <ul className='flex h-full'>
          {filteredNavigationItems.map((item: NavigationItem) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <li key={item.id} ref={isActive ? activeItemRef : null} className='flex-shrink-0'>
                <Link
                  href={item.path}
                  className={`flex flex-col items-center justify-center w-20 h-full transition-colors duration-200 ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  <span className='flex-shrink-0'>{item.icon}</span>
                  <span className='text-xs mt-1'>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
