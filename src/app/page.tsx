import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">歡迎來到 Lin LLC</h1>
        <p className="text-lg mb-8">這是我們的首頁</p>
        <Link href="/user/account">
          <Button>前往會員中心</Button>
        </Link>
      </div>
    </div>
  );
}
