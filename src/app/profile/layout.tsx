'use client';

import { ReactNode, ReactElement } from 'react';

import { PermissionCheck } from '@/components/common/PermissionCheck';

interface ProfileLayoutProps {
  children: ReactNode;
}

export default function ProfileLayout({ children }: ProfileLayoutProps): ReactElement {
  return (
    <PermissionCheck requiredPermission='profile'>
      <div className='flex min-h-screen bg-gray-50 dark:bg-gray-900'>
        <div className='flex-1 p-6'>{children}</div>
      </div>
    </PermissionCheck>
  );
}
