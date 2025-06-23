/**
 * 財務模組統一布局
 *
 * 為所有財務相關頁面（合約、訂單、報價單、封存）提供統一的權限驗證。
 * 根據當前路徑動態判斷所需權限。
 */
'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, useMemo } from 'react';

import { PermissionCheck } from '@/components/common/PermissionCheck';
import { Unauthorized } from '@/components/common/Unauthorized';

// Define all valid finance-related permissions
type FinancePermission = 'contracts' | 'orders' | 'quotes' | 'archive';

const isValidFinancePermission = (type: string): type is FinancePermission => {
  return ['contracts', 'orders', 'quotes', 'archive'].includes(type);
};

export default function FinanceLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const requiredPermission = useMemo((): FinancePermission | 'pass-through' | null => {
    const segments = pathname.split('/').filter(Boolean); // e.g., ['finance', 'contracts']

    // For the top-level /finance page, which doesn't exist, we can let it pass through to the 404 page.
    // This also handles paths outside the finance module.
    if (segments.length < 2 || segments[0] !== 'finance') {
      return 'pass-through';
    }

    const type = segments[1];

    if (isValidFinancePermission(type)) {
      return type;
    }

    // Any other path under /finance is considered invalid.
    return null;
  }, [pathname]);

  if (requiredPermission === null) {
    return <Unauthorized message='您沒有權限存取此財務區塊' />;
  }

  if (requiredPermission === 'pass-through') {
    return <>{children}</>;
  }

  return (
    <PermissionCheck requiredPermission={requiredPermission}>
      {children}
    </PermissionCheck>
  );
} 