/**
 * 頁面布局組件
 * 提供系統頁面的基本布局結構
 * 支援側邊欄和主要內容區域的配置
 * 管理頁面的響應式布局
 */

import { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  withSidebar?: boolean;
}

export function PageLayout({ children, className = '', withSidebar = false }: PageLayoutProps) {
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      <div className={`flex ${withSidebar ? 'flex-row' : 'flex-col'}`}>{children}</div>
    </div>
  );
}

interface PageContentProps {
  children: ReactNode;
  className?: string;
}

export function PageContent({ children, className = '' }: PageContentProps) {
  return <main className={`flex-1 p-6 pb-20 ${className}`}>{children}</main>;
}

interface SidebarProps {
  children: ReactNode;
  className?: string;
}

export function Sidebar({ children, className = '' }: SidebarProps) {
  return (
    <aside
      className={`
      w-72 h-[calc(100vh-4rem)] sticky top-0
      border-r border-gray-200 dark:border-gray-700 
      bg-white dark:bg-gray-800 p-6 
      overflow-y-auto pb-20
      ${className}
    `}
    >
      {children}
    </aside>
  );
}
