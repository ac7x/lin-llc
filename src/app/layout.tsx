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

import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { firebaseApp } from '@/lib/firebase-client.ts'; // 你自己的 firebase 初始化檔案

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

  // 客戶端標誌與 App Check 初始化
  useEffect(() => {
    setIsClient(true);

    if (typeof window !== 'undefined') {
      initializeAppCheck(firebaseApp, {
        provider: new ReCaptchaV3Provider(APP_CHECK_CONFIG.SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });
    }
  }, []);

  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (loading) {
    return (
      <html lang='zh-TW'>
        <body
          style={{
            '--font-geist-sans': geistSans.variable,
            '--font-geist-mono': geistMono.variable,
          } as React.CSSProperties}
          className='antialiased bg-white dark:bg-gray-900'
        >
          <div className='flex justify-center items-center min-h-screen'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400'></div>
          </div>
        </body>
      </html>
    );
  }

  if (!isPublicPath && !user) {
    return (
      <html lang='zh-TW'>
        <body
          style={{
            '--font-geist-sans': geistSans.variable,
            '--font-geist-mono': geistMono.variable,
          } as React.CSSProperties}
          className='antialiased bg-white dark:bg-gray-900'
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
        style={{
          '--font-geist-sans': geistSans.variable,
          '--font-geist-mono': geistMono.variable,
        } as React.CSSProperties}
        className='antialiased bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100'
      >
        <main className='pb-16'>{children}</main>
        {user && <BottomNavigation />}
      </body>
    </html>
  );
}