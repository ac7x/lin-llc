/**
 * 報價單模組布局
 *
 * 提供報價單相關頁面的共用布局，包含：
 * - 響應式設計
 * - 權限驗證
 */

'use client';

import { ReactNode } from 'react';
import { PermissionCheck } from '@/components/common/PermissionCheck';

export default function QuotesLayout({ children }: { children: ReactNode }) {
  return (
    <PermissionCheck requiredPermission='quotes'>
      <div className='p-6'>{children}</div>
    </PermissionCheck>
  );
}
