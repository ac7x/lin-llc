/**
 * 報價單模組布局
 *
 * 為報價單相關頁面提供權限驗證。
 */

'use client';

import { ReactNode } from 'react';
import { PermissionCheck } from '@/components/common/PermissionCheck';

export default function QuotesLayout({ children }: { children: ReactNode }) {
  return <PermissionCheck requiredPermission='quotes'>{children}</PermissionCheck>;
}
