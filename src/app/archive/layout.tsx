/**
 * 封存功能布局組件
 *
 * 提供封存功能的基本布局結構，包含：
 * - 權限驗證
 * - 子路由渲染
 */

'use client';

import { ReactNode, ReactElement } from 'react';

import { Unauthorized } from '@/components/common/Unauthorized';
import { useAuth } from '@/hooks/useAuth';

interface ArchiveLayoutProps {
  children: ReactNode;
}

export default function ArchiveLayout({ children }: ArchiveLayoutProps): ReactElement {
  const { user, hasPermission } = useAuth();

  // 檢查用戶是否有封存功能的權限
  if (!user || !hasPermission('archive')) {
    return <Unauthorized message='您沒有權限訪問封存功能，請聯繫管理員以獲取訪問權限' />;
  }

  return <div className='p-6'>{children}</div>;
}
