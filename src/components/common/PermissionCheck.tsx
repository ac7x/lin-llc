/**
 * 權限檢查組件 (PermissionCheck)
 *
 * 用於包裝需要特定權限才能訪問的內容。
 * 功能包括：
 * - 檢查當前使用者是否擁有指定的權限
 * - 在權限驗證中顯示載入狀態
 * - 若無權限，則顯示「未授權」頁面
 * - 若有權限，則正常渲染子組件
 */
import type { ReactElement, ReactNode } from 'react';

import { ROLE_NAMES } from '@/constants/roles';
import { useAuth } from '@/hooks/useAuth';

import { Unauthorized } from './Unauthorized';

interface PermissionCheckProps {
  children: ReactNode;
  requiredPermission: string;
  unauthorizedMessage?: string;
}

export function PermissionCheck({
  children,
  requiredPermission,
  unauthorizedMessage,
}: PermissionCheckProps): ReactElement {
  const { user, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  if (!hasPermission(requiredPermission)) {
    const roleName = user?.currentRole ? ROLE_NAMES[user.currentRole] : '未知';
    return (
      <Unauthorized
        message={unauthorizedMessage || `您目前的角色 (${roleName}) 沒有權限訪問此功能。`}
      />
    );
  }

  return <>{children}</>;
}
