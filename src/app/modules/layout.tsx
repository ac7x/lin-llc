import { ReCaptchaV3Provider } from './ReCaptchaV3Provider';
import { geistSans, geistMono } from '../layout';
import BottomNavigation from '@/components/tabs/BottomNavigation';

// ...

function Layout({ children, user }: { children: React.ReactNode; user?: boolean }) {
  return (
    <>
      <ReCaptchaV3Provider />
      <main className='pb-16'>{children}</main>
      {user && <BottomNavigation />}
    </>
  );
}

export default Layout;
