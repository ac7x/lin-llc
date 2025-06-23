/**
 * 專案模組布局
 *
 * 提供專案相關頁面的共用布局，包含：
 * - 權限驗證
 * - 響應式設計
 * - 基本內容布局
 */

'use client';

import { type ReactNode } from 'react';

import { PermissionCheck } from '@/components/common/PermissionCheck';

export default function ProjectsLayout({ children }: { children: ReactNode }) {
  return (
    <PermissionCheck requiredPermission='projects'>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="p-6 pb-20">
          {children}
        </main>
      </div>
    </PermissionCheck>
  );
}
