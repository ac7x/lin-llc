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
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';

import { ROLE_NAMES } from '@/constants/roles';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase-client';
import type { CustomRole } from '@/constants/roles';

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
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // 載入自訂角色以取得角色名稱
  useEffect(() => {
    const loadCustomRoles = async () => {
      try {
        const rolesSnapshot = await getDocs(collection(db, 'customRoles'));
        const roles: CustomRole[] = [];
        rolesSnapshot.forEach(doc => {
          roles.push({ id: doc.id, ...doc.data() } as CustomRole);
        });
        setCustomRoles(roles);
      } catch (error) {
        console.error('Failed to load custom roles:', error);
      } finally {
        setLoadingRoles(false);
      }
    };

    if (user?.currentRole && !ROLE_NAMES[user.currentRole as keyof typeof ROLE_NAMES]) {
      void loadCustomRoles();
    } else {
      setLoadingRoles(false);
    }
  }, [user]);

  if (loading || loadingRoles) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  if (!hasPermission(requiredPermission)) {
    let roleName = '未知';
    if (user?.currentRole) {
      // 檢查是否為標準角色
      if (user.currentRole in ROLE_NAMES) {
        roleName = ROLE_NAMES[user.currentRole as keyof typeof ROLE_NAMES];
      } else {
        // 檢查是否為自訂角色
        const customRole = customRoles.find(r => r.id === user.currentRole);
        roleName = customRole ? customRole.name : user.currentRole;
      }
    }
    
    return (
      <Unauthorized
        message={unauthorizedMessage || `您目前的角色 (${roleName}) 沒有權限訪問此功能。`}
      />
    );
  }

  return <>{children}</>;
}
