// app/layout.tsx
// 這是一個 Server Component (預設)

import { Inter } from 'next/font/google';
import { FirebaseProvider } from '../modules/projects/components/firebase/FirebaseProvider'; // 調整路徑以符合您的項目結構

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Firebase Admin + Auth + App Check Demo',
  description: 'Next.js App Router with advanced Firebase security',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* 將整個應用程式包裹在 FirebaseProvider 中，以初始化客戶端 Firebase SDK */}
        {/* FirebaseProvider 是一個 Client Component，因此它會在瀏覽器端執行 */}
        <FirebaseProvider>
          {children}
        </FirebaseProvider>
      </body>
    </html>
  );
}
