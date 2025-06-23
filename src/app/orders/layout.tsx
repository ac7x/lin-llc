/**
 * 訂單模組布局
 *
 * 提供訂單相關頁面的共用布局，包含：
 * - 響應式設計
 * - 權限驗證
 */

'use client';

import { ReactNode } from 'react';
import { PermissionCheck } from '@/components/common/PermissionCheck';

interface OrdersLayoutProps {
  children: ReactNode;
}

export default function OrdersLayout({ children }: OrdersLayoutProps) {
  return (
    <PermissionCheck requiredPermission='orders'>
      <div className='p-6'>{children}</div>
    </PermissionCheck>
  );
}
