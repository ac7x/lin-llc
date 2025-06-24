'use client';

import { Inter } from 'next/font/google';
import Script from 'next/script';
import { useEffect } from 'react';
import '@/styles/globals.css';
import { AuthProvider } from '@/context/auth-context';
import { APP_CHECK_CONFIG } from '@/lib/firebase-config';
import { firebaseManager } from '@/lib/firebase-manager';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    firebaseManager.initializeClientServices().catch(error => {
      console.error('初始化客戶端服務失敗:', error);
    });
  }, []);

  return (
    <html lang="zh-TW">
      <head>
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${APP_CHECK_CONFIG.SITE_KEY}`}
          strategy="beforeInteractive"
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
