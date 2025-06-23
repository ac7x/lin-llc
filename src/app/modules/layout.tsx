'use client';

import BottomNavigation from '@/components/tabs/BottomNavigation';
import { useAuth } from '@/hooks/useAuth';

// 正確定義 LayoutProps 接口，只包含 children
interface LayoutProps {
  children: React.ReactNode;
}

// 使用 LayoutProps 接口來定義組件
function Layout({ children }: LayoutProps) {
  const { user } = useAuth();

  return (
    <>
      <main className='pb-16'>{children}</main>
      {user && <BottomNavigation />}
    </>
  );
}

export default Layout;
