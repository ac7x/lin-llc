/**
 * 合約模組布局
 *
 * 提供合約相關頁面的共用布局
 */

'use client';

import { ReactNode } from 'react';

interface ContractsLayoutProps {
  children: ReactNode;
}

export default function ContractsLayout({ children }: ContractsLayoutProps) {
  return <div className='p-6'>{children}</div>;
}
