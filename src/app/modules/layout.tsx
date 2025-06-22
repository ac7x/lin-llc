'use client';

import { useEffect } from 'react';
import { geistSans, geistMono } from '../layout';
import BottomNavigation from '@/components/tabs/BottomNavigation';
import { testAppCheck } from '@/lib/firebase-client';
import { useAuth } from '@/hooks/useAuth';

// 正確定義 LayoutProps 接口，只包含 children
interface LayoutProps {
  children: React.ReactNode;
}

// 使用 LayoutProps 接口來定義組件
function Layout({ children }: LayoutProps) {
  const { user } = useAuth();

  // 初始化 App Check
  useEffect(() => {
    const initializeAppCheck = async () => {
      try {
        const success = await testAppCheck();
        if (success) {
          console.log('App Check 已成功初始化並啟用嚴格模式');
        } else {
          console.warn('App Check 初始化失敗，但應用將繼續運行');
        }
      } catch (error) {
        console.error('App Check 初始化過程中發生錯誤:', error);
      }
    };

    initializeAppCheck();
  }, []);

  return (
    <>
      <main className='pb-16'>{children}</main>
      {user && <BottomNavigation />}
    </>
  );
}

export default Layout;
