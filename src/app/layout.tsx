import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import Script from "next/script";
import { OwnerBottomNavWrapper } from "@/components/bottom/owner-nav-wrapper";

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

export const metadata: Metadata = {
  title: "Lin.LLC",
  description: "Lin.LLC - 提供專業的軟體開發與 AI 解決方案",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="zh-Hant" className="dark">
      <head>
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        {/* 僅用戶登入時顯示底部導覽列 */}
        <OwnerBottomNavWrapper />
      </body>
    </html>
  );
}