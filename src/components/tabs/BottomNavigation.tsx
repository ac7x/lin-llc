'use client';

import { ChevronRight, File, Folder } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useEffect, useState } from 'react';
import type { ReactElement } from 'react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { navigationItems } from '@/constants/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { NavigationItem } from '@/types/navigation';

// 專案樹狀結構數據
const projectTreeData = [
  {
    name: '專案管理',
    items: [
      {
        name: '進行中專案',
        items: [
          { name: '專案 A', path: '/projects/project-a' },
          { name: '專案 B', path: '/projects/project-b' },
        ],
      },
      {
        name: '已完成專案',
        items: [
          { name: '專案 C', path: '/projects/project-c' },
          { name: '專案 D', path: '/projects/project-d' },
        ],
      },
    ],
  },
  {
    name: '工作包',
    items: [
      { name: '設計階段', path: '/workpackages/design' },
      { name: '施工階段', path: '/workpackages/construction' },
      { name: '驗收階段', path: '/workpackages/acceptance' },
    ],
  },
];

// 樹狀組件
function TreeItem({ item, pathname }: { item: any; pathname: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.items && item.items.length > 0;

  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={pathname === item.path}
          className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
        >
          <Link href={item.path}>
            <File className="w-4 h-4" />
            {item.name}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="group/collapsible [&[data-state=open]>svg:first-child]:rotate-90">
            <ChevronRight className="w-4 h-4 transition-transform" />
            <Folder className="w-4 h-4" />
            {item.name}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items.map((subItem: any, index: number) => (
              <TreeItem key={index} item={subItem} pathname={pathname} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}

// 主要導航組件
function MainNavigation({ pathname, filteredNavigationItems }: { 
  pathname: string; 
  filteredNavigationItems: NavigationItem[] 
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>主要功能</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {filteredNavigationItems.map((item: NavigationItem) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                >
                  <Link href={item.path}>
                    <span className="flex-shrink-0">{item.icon}</span>
                    {item.name}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

// 專案樹狀導航組件
function ProjectTreeNavigation({ pathname }: { pathname: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>專案結構</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {projectTreeData.map((item, index) => (
            <TreeItem key={index} item={item} pathname={pathname} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

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
                  <Link
                    href={item.path}
                    className={`flex flex-col items-center justify-center w-20 h-full rounded-none transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="text-xs mt-1 font-medium">{item.name}</span>
                  </Link>
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
    <SidebarProvider defaultOpen={true}>
      <Sidebar className="fixed left-0 top-0 h-full w-64 bg-background border-r border-border z-40">
        <SidebarHeader className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              LIN LLC
            </h1>
            <SidebarTrigger className="h-8 w-8" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <MainNavigation 
            pathname={pathname} 
            filteredNavigationItems={filteredNavigationItems} 
          />
          <ProjectTreeNavigation pathname={pathname} />
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}
