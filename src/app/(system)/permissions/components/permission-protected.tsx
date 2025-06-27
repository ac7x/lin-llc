'use client';

import { ReactNode } from 'react';
import { usePermission } from '../hooks/use-permission';
import { PermissionAlert } from './permission-alert';

interface PermissionProtectedProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
  alertType?: 'access' | 'view' | 'edit' | 'delete' | 'settings';
  alertTitle?: string;
  alertMessage?: string;
  className?: string;
}

export function PermissionProtected({
  permission,
  children,
  fallback,
  alertType = 'access',
  alertTitle,
  alertMessage,
  className,
}: PermissionProtectedProps) {
  const { hasPermission, loading } = usePermission();

  if (loading) {
    return null;
  }

  if (!hasPermission(permission)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <PermissionAlert
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        className={className}
      />
    );
  }

  return <>{children}</>;
} 