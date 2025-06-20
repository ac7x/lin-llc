import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Unauthorized } from './Unauthorized';
import { ROLE_NAMES } from '@/constants/roles';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { DEFAULT_ROLE_PERMISSIONS } from '@/app/management/components/RolePermissions';

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
  const { user, loading } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [checkingPermission, setCheckingPermission] = useState<boolean>(true);

  useEffect(() => {
    const checkPermission = async (): Promise<void> => {
      if (!user?.currentRole) {
        setHasPermission(false);
        setCheckingPermission(false);
        return;
      }

      try {
        const managementRef = collection(db, 'management');
        const snapshot = await getDocs(managementRef);
        const roleData = snapshot.docs.find(doc => {
          const data = doc.data();
          return data.role === user.currentRole;
        });

        if (roleData) {
          const data = roleData.data();
          const permissions = data.pagePermissions.map((p: { id: string }) => p.id);
          setHasPermission(permissions.includes(requiredPermission));
        } else {
          // 如果找不到角色配置，使用預設權限
          const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[user.currentRole] || [];
          setHasPermission(defaultPermissions.includes(requiredPermission));
        }
      } catch (error) {
        console.error('檢查權限失敗:', error);
        setHasPermission(false);
      } finally {
        setCheckingPermission(false);
      }
    };

    void checkPermission();
  }, [user?.currentRole, requiredPermission]);

  // 如果正在載入或檢查權限，顯示載入中
  if (loading || checkingPermission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 如果沒有用戶或沒有權限，顯示未授權訊息
  if (!user || !hasPermission) {
    const roleName = user?.currentRole ? ROLE_NAMES[user.currentRole] : '未知角色';
    return (
      <Unauthorized 
        message={unauthorizedMessage || `您目前的角色 (${roleName}) 沒有權限訪問此功能`}
      />
    );
  }

  return <>{children}</>;
} 