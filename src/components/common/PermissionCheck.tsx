import { ReactNode } from 'react';
import { useAuth } from '@/app/signin/hooks/useAuth';
import { Unauthorized } from './Unauthorized';

interface PermissionCheckProps {
  children: ReactNode;
  requiredPermission: string;
  unauthorizedMessage?: string;
}

export function PermissionCheck({ 
  children, 
  requiredPermission,
  unauthorizedMessage = '您沒有權限訪問此功能，請聯繫管理員以獲取訪問權限'
}: PermissionCheckProps): React.ReactElement {
  const { user, hasPermission } = useAuth();

  if (!user || !hasPermission(requiredPermission)) {
    return (
      <Unauthorized 
        message={unauthorizedMessage}
      />
    );
  }

  return <>{children}</>;
} 