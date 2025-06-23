/**
 * 訂單模組布局
 *
 * 為訂單相關頁面提供權限驗證。
 */

'use client';

import { ReactNode } from 'react';
import { PermissionCheck } from '@/components/common/PermissionCheck';

interface OrdersLayoutProps {
  children: ReactNode;
}

export default function OrdersLayout({ children }: OrdersLayoutProps) {
  return <PermissionCheck requiredPermission='orders'>{children}</PermissionCheck>;
}
