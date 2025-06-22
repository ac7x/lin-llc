import { ReCaptchaV3Provider } from './ReCaptchaV3Provider';
import { geistSans, geistMono } from '../layout';
import BottomNavigation from '@/components/tabs/BottomNavigation';

// ...

function Layout({ children, user }: { children: React.ReactNode; user?: boolean }) {
  return (
    <html lang='zh-TW'>
      <head>
        <ReCaptchaV3Provider />
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

export default Layout;
