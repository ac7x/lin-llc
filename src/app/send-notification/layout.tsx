'use client';

import { ReactNode, ReactElement } from 'react';

import { PermissionCheck } from '@/components/common/PermissionCheck';

interface SendNotificationLayoutProps {
  children: ReactNode;
}

export default function SendNotificationLayout({
  children,
}: SendNotificationLayoutProps): ReactElement {
  return (
    <PermissionCheck requiredPermission='send-notification'>
      <div className='flex min-h-screen bg-gray-50 dark:bg-gray-900'>
        <div className='flex-1 p-6'>{children}</div>
      </div>
    </PermissionCheck>
  );
}
