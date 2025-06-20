'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { type RoleKey } from '@/constants/roles';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { DEFAULT_ROLE_PERMISSIONS } from '@/app/management/components/RolePermissions';

interface NavigationItem {
  id: string;
  name: string;
  path: string;
  icon: React.ReactNode;
}

interface RolePermissionData {
  role: RoleKey;
  pagePermissions: Array<{
    id: string;
    name: string;
    description: string;
    path: string;
  }>;
  updatedAt: string;
}

const navigationItems: NavigationItem[] = [
  // 主要工作區域
  {
    id: 'dashboard',
    name: '儀表板',
    path: '/dashboard',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'projects',
    name: '專案',
    path: '/projects',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    id: 'schedule',
    name: '排程',
    path: '/schedule',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'calendar',
    name: '行事曆',
    path: '/calendar',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  
  // 業務管理
  {
    id: 'quotes',
    name: '報價',
    path: '/quotes',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'orders',
    name: '訂單',
    path: '/orders',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    id: 'contracts',
    name: '合約',
    path: '/contracts',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  
  // 工具與協助
  {
    id: 'gemini',
    name: 'AI 助手',
    path: '/gemini',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  
  // 通知與通訊
  {
    id: 'notifications',
    name: '通知',
    path: '/notifications',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    id: 'send-notification',
    name: '發送通知',
    path: '/send-notification',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  
  // 系統管理
  {
    id: 'management',
    name: '管理',
    path: '/management',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'archive',
    name: '封存',
    path: '/archive',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
  },
  
  // 個人設定
  {
    id: 'profile',
    name: '個人',
    path: '/profile',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function BottomNavigation(): React.ReactElement {
  const pathname = usePathname();
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollStartX, setScrollStartX] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPermissions = async (): Promise<void> => {
      if (!user?.currentRole) return;

      try {
        const managementRef = collection(db, 'management');
        const snapshot = await getDocs(managementRef);
        const roleData = snapshot.docs.find(doc => {
          const data = doc.data() as RolePermissionData;
          return data.role === user.currentRole;
        });

        if (roleData) {
          const data = roleData.data() as RolePermissionData;
          setPermissions(data.pagePermissions.map(p => p.id));
        } else {
          // 如果找不到角色配置，使用預設權限
          const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[user.currentRole] || [];
          setPermissions(defaultPermissions);
        }
      } catch (error) {
        console.error('載入權限失敗:', error);
        // 發生錯誤時使用預設權限
        const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[user.currentRole] || [];
        setPermissions(defaultPermissions);
      }
    };

    void fetchPermissions();
  }, [user?.currentRole]);

  const filteredNavigationItems = navigationItems.filter(item => {
    if (!user?.currentRole) return false;
    return permissions.includes(item.id);
  });

  // 觸控事件處理
  const handleTouchStart = useCallback((e: React.TouchEvent): void => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setScrollStartX(scrollLeft);
  }, [scrollLeft]);

  const handleTouchMove = useCallback((e: React.TouchEvent): void => {
    if (!isDragging) return;
    
    e.preventDefault();
    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    const newScrollLeft = scrollStartX + diff;
    
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = newScrollLeft;
      setScrollLeft(newScrollLeft);
    }
  }, [isDragging, startX, scrollStartX]);

  const handleTouchEnd = useCallback((): void => {
    setIsDragging(false);
  }, []);

  // 滑動到指定項目
  const scrollToItem = useCallback((index: number): void => {
    if (scrollContainerRef.current) {
      const itemWidth = scrollContainerRef.current.scrollWidth / filteredNavigationItems.length;
      const targetScroll = index * itemWidth;
      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
      setScrollLeft(targetScroll);
    }
  }, [filteredNavigationItems.length]);

  // 自動滑動到當前活動項目
  useEffect(() => {
    const activeIndex = filteredNavigationItems.findIndex(item => item.path === pathname);
    if (activeIndex !== -1) {
      scrollToItem(activeIndex);
    }
  }, [pathname, filteredNavigationItems, scrollToItem]);

  if (!user) return <></>;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="max-w-screen-xl mx-auto px-4">
        {/* 滑動指示器 */}
        <div className="flex justify-center space-x-1 py-1">
          {filteredNavigationItems.map((_, index) => {
            const isActive = pathname === filteredNavigationItems[index].path;
            return (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  isActive 
                    ? 'bg-indigo-600 dark:bg-indigo-400' 
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            );
          })}
        </div>
        
        {/* 可滑動的導航容器 */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {filteredNavigationItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.id}
                href={item.path}
                className={`flex flex-col items-center py-2 px-3 min-w-[80px] flex-shrink-0 ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                } ${isDragging ? 'pointer-events-none' : ''}`}
              >
                {item.icon}
                <span className="text-xs mt-1 text-center">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* 自定義滾動條樣式 */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </nav>
  );
} 