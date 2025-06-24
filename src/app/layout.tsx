import { ReactNode } from 'react';
import { AuthProvider } from '@/context/auth-provider';
import '@/styles/globals.css';

export const metadata = {
  title: 'Lin LLC',
  description: 'Project for Lin LLC',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
