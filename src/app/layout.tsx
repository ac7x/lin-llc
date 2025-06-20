/**
 * 根布局組件
 *
 * 提供整個應用程式的基本布局結構，包含：
 * - 字體設定（Geist Sans 和 Geist Mono）
 * - 深色模式支援
 * - reCAPTCHA 整合
 * - 底部導航列（僅登入用戶可見）
 * - 全局驗證狀態
 */

'use client';

import { Geist, Geist_Mono } from 'next/font/google';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import React, { useEffect, useState } from 'react';
import '../styles/globals.css';
import type { ReactElement, ReactNode } from 'react';

import { Unauthorized } from '@/components/common/Unauthorized';
import BottomNavigation from '@/components/tabs/BottomNavigation';
import { useAuth } from '@/hooks/useAuth';
import { APP_CHECK_CONFIG } from '@/lib/firebase-config';

const geistSans = Geist({
  variable: '--font-geist-sans',
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
});

// 不需要驗證的路徑
const PUBLIC_PATHS = ['/signin', '/signup', '/forgot-password'];

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  // 檢查是否在客戶端環境
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 檢查當前路徑是否需要驗證
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  // 如果正在載入，顯示載入中狀態
  if (loading) {
    return (
      <html lang='zh-TW'>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-gray-900`}
        >
          <div className='flex justify-center items-center min-h-screen'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400'></div>
          </div>
        </body>
      </html>
    );
  }

  // 如果不是公開路徑且用戶未登入，顯示未授權頁面
  if (!isPublicPath && !user) {
    return (
      <html lang='zh-TW'>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-gray-900`}
        >
          <Unauthorized
            message='請先登入以訪問此頁面'
            showBackButton={false}
            showSignInButton={true}
          />
        </body>
      </html>
    );
  }

  return (
    <html lang='zh-TW'>
      <head>
        {isClient && (
          <Script
            src={`https://www.google.com/recaptcha/api.js?render=${APP_CHECK_CONFIG.SITE_KEY}`}
            strategy='beforeInteractive'
          />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100`}
      >
        <main className='pb-16'>{children}</main>
        {user && <BottomNavigation />}
      </body>
    </html>
  );
}
