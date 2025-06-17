/**
 * 根布局組件
 * 
 * 提供整個應用程式的基本布局結構，包含：
 * - 字體設定（Geist Sans 和 Geist Mono）
 * - 深色模式支援
 * - reCAPTCHA 整合
 * - 底部導航列（僅登入用戶可見）
 */

'use client';

import React from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import Script from "next/script";
import BottomNavigation from '@/components/tabs/BottomNavigation';

const geistSans = Geist({
  variable: "--font-geist-sans",
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="zh-TW">
      <head>
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <main className="pb-16">
          {children}
        </main>
        <BottomNavigation />
      </body>
    </html>
  );
}