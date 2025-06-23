/**
 * 財務模組統一布局
 *
 * 為所有財務相關頁面（合約、訂單、報價單）提供權限驗證。
 * 根據當前路徑動態判斷所需權限。
 */
'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, useMemo } from 'react';

import { PermissionCheck } from '@/components/common/PermissionCheck';
import { Unauthorized } from '@/components/common/Unauthorized';

type FinancePermission = 'contracts' | 'orders' | 'quotes';

export default function FinanceLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const requiredPermission = useMemo((): FinancePermission | null => {
    if (pathname.startsWith('/finance/contracts')) {
      return 'contracts';
    }
    if (pathname.startsWith('/finance/orders')) {
      return 'orders';
    }
    if (pathname.startsWith('/finance/quotes')) {
      return 'quotes';
    }
    return null;
  }, [pathname]);

  if (!requiredPermission) {
    // 此情況不應在財務部分的任何有效頁面中發生。
    // 它是針對意外路由情境的後備方案。
    return <Unauthorized message="您沒有權限存取此財務區塊" />;
  }

  return (
    <PermissionCheck requiredPermission={requiredPermission}>
      {children}
    </PermissionCheck>
  );
} 