import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Unauthorized } from './Unauthorized';
import { ROLE_NAMES } from '@/constants/roles';

interface PermissionCheckProps {
  children: ReactNode;
  requiredPermission: string;
  unauthorizedMessage?: string;
}

export function PermissionCheck({ 
  children, 
  requiredPermission,
  unauthorizedMessage
}: PermissionCheckProps): React.ReactElement {
  const { user, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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