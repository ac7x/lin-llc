import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { AuthProvider } from '@/context/auth-context';
import { PermissionProvider } from '@/context/permission-context';
import { BottomNavigation } from '@/components/ui/bottom-navigation';
import { ThemeProvider } from '@/components/ui/theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LIN LLC - 企業管理系統',
  description: '現代化的企業管理平台，提供財務、專案和 AI 助手功能',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <PermissionProvider>
              <div style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
                <div className="w-full min-h-[calc(100vh-5rem-env(safe-area-inset-bottom))]">
                  <div className="h-full">
                    {children}
                  </div>
                </div>
              </div>
              <BottomNavigation />
            </PermissionProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
