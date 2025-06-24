// src/app/layout.tsx
'use client'; // 確保這是 Client Component

import { useEffect } from 'react';
import { initializeClientServices } from '@/lib/firebase-init';
import { logError } from '@/utils/errorUtils';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // 初始化 Firebase 客戶端服務（包括 App Check）
    const initializeAppCheck = async () => {
      try {
        await initializeClientServices();
      } catch (error) {
        logError(error, { operation: 'initialize_app_check' });
      }
    };

    initializeAppCheck();
  }, []);

  return (
    <html lang="zh-TW">
      <body>
        {children}
      </body>
    </html>
  );
}