'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useEffect, useState } from 'react';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import { navigationItems } from '@/constants/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { NavigationItem } from '@/types/navigation';

export default function BottomNavigation(): ReactElement | null {
  const pathname = usePathname();
  const { user, hasPermission } = useAuth();
  const activeItemRef = useRef<HTMLLIElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const filteredNavigationItems = navigationItems.filter((item: NavigationItem) =>
    hasPermission(item.id)
  );

  // 檢測設備類型
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

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

  // 移動設備版本 - 底部導航
  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border z-50">
        <div className="flex justify-center overflow-x-auto scrollbar-hide h-full items-center">
          <ul className="flex h-full">
            {filteredNavigationItems.map((item: NavigationItem) => {
              const isActive = pathname.startsWith(item.path);
              return (
                <li key={item.id} ref={isActive ? activeItemRef : null} className="flex-shrink-0">
                  <Button
                    asChild
                    variant={isActive ? 'default' : 'ghost'}
                    size="icon"
                    className={cn(
                      'flex flex-col items-center justify-center w-20 h-full rounded-none',
                      'transition-all duration-200',
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Link href={item.path}>
                      <span className="flex-shrink-0">{item.icon}</span>
                      <span className="text-xs mt-1 font-medium">{item.name}</span>
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    );
  }

  // 桌面版本 - 側邊導航
  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-background border-r border-border z-40">
      <div className="flex flex-col h-full">
        {/* Logo 區域 */}
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            LIN LLC
          </h1>
        </div>

        {/* 導航項目 */}
        <div className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2 px-4">
            {filteredNavigationItems.map((item: NavigationItem) => {
              const isActive = pathname.startsWith(item.path);
              return (
                <li key={item.id} ref={isActive ? activeItemRef : null}>
                  <Button
                    asChild
                    variant={isActive ? 'default' : 'ghost'}
                    className={cn(
                      'w-full justify-start h-12 px-4',
                      'transition-all duration-200',
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Link href={item.path}>
                      <span className="flex-shrink-0 mr-3">{item.icon}</span>
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* 用戶資訊區域 */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.displayName || user.email}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
