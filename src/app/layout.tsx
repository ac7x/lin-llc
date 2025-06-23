/**
 * 根布局組件
 *
 * 提供整個應用程式的基本布局結構，包含：
 * - 字體設定（Geist Sans 和 Geist Mono）
 * - 深色模式支援
 * - reCAPTCHA 整合
 * - 響應式導航列（僅登入用戶可見）
 * - 全局驗證狀態
 */

'use client';

import { Inter, Roboto_Mono } from 'next/font/google';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import React, { useEffect, useState } from 'react';
import '../styles/globals.css';
import type { ReactElement, ReactNode } from 'react';

import { Unauthorized } from '@/components/common/Unauthorized';
import BottomNavigation from '@/components/tabs/BottomNavigation';
import { useAppCheck } from '@/hooks/useAppCheck';
import { useAuth } from '@/hooks/useAuth';
import { APP_CHECK_CONFIG } from '@/lib/firebase-config';
import { initializeClientServices } from '@/lib/firebase-init';
import { ThemeProvider } from '@/providers/theme-provider';

const geistSans = Inter({
  variable: '--font-geist-sans',
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
});

const geistMono = Roboto_Mono({
  variable: '--font-geist-mono',
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
});

// 不需要驗證的路徑
const PUBLIC_PATHS = ['/account'];

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): ReactElement {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { isInitialized, isValid, error } = useAppCheck();

  // 檢查是否在客戶端環境
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 檢測設備類型
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    if (isClient) {
      checkDevice();
      window.addEventListener('resize', checkDevice);
      return () => window.removeEventListener('resize', checkDevice);
    }
  }, [isClient]);

  // 初始化客戶端服務
  useEffect(() => {
    if (isClient) {
      initializeClientServices().catch(error => {
        console.error('初始化客戶端服務失敗:', error);
      });
    }
  }, [isClient]);

  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  const showUnauthorized = !isPublicPath && !user;

  const renderContent = () => {
    if (!isInitialized || loading) {
      return (
        <div className='flex justify-center items-center min-h-screen'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
        </div>
      );
    }

    if (!isValid || error) {
      return (
        <Unauthorized
          message='安全驗證失敗，請重新載入頁面'
          showBackButton={false}
          showSignInButton={false}
        />
      );
    }

    if (showUnauthorized) {
      return (
        <Unauthorized
          message='請先登入以訪問此頁面'
          showBackButton={false}
          showSignInButton={true}
        />
      );
    }

    return (
      <>
        <main className={user ? (isMobile ? 'pb-16' : 'ml-64') : ''}>{children}</main>
        {user && <BottomNavigation />}
      </>
    );
  };

  return (
    <html lang='zh-TW' suppressHydrationWarning>
      <head>
        {isClient && (
          <Script
            src={`https://www.google.com/recaptcha/api.js?render=${APP_CHECK_CONFIG.SITE_KEY}`}
            strategy='beforeInteractive'
          />
        )}
      </head>
      <body
        style={
          {
            '--font-geist-sans': geistSans.variable,
            '--font-geist-mono': geistMono.variable,
          } as React.CSSProperties
        }
        className='antialiased bg-background text-foreground'
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          {renderContent()}
        </ThemeProvider>
      </body>
    </html>
  );
}

export { geistSans, geistMono };
