'use client';

import { ReactNode, ReactElement } from 'react';

import { PermissionCheck } from '@/components/common/PermissionCheck';

interface GeminiLayoutProps {
  children: ReactNode;
}

export default function GeminiLayout({ children }: GeminiLayoutProps): ReactElement {
  return (
    <PermissionCheck requiredPermission='gemini'>
      <div className='flex min-h-screen bg-gray-50 dark:bg-gray-900'>
        <div className='flex-1 p-6'>{children}</div>
      </div>
    </PermissionCheck>
  );
}
