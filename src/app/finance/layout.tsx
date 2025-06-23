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

const isValidFinancePermission = (type: string): type is FinancePermission => {
  return ['contracts', 'orders', 'quotes'].includes(type);
};

export default function FinanceLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const requiredPermission = useMemo((): FinancePermission | null => {
    const segments = pathname.split('/').filter(Boolean); // e.g., ['finance', 'contracts', '...']
    if (segments.length >= 2 && segments[0] === 'finance') {
      const type = segments[1];
      if (isValidFinancePermission(type)) {
        return type;
      }
    }
    return null;
  }, [pathname]);

  if (!requiredPermission) {
    // This case should not happen for any valid page within the finance section.
    // It's a fallback for unexpected routing scenarios.
    return <Unauthorized message='您沒有權限存取此財務區塊' />;
  }

  return (
    <PermissionCheck requiredPermission={requiredPermission}>
      {children}
    </PermissionCheck>
  );
} 