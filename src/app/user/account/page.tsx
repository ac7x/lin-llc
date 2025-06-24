'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/auth-provider';
import { signOut } from '@/lib/firebase-auth';
import { Button } from '@/components/ui/button';

export default function AccountPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/user/account/signin');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div>正在載入...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl mb-4">歡迎, {user.displayName}</h1>
        <p className="mb-2">Email: {user.email}</p>
        {user.photoURL && (
          <Image
            src={user.photoURL}
            alt="User Avatar"
            width={96}
            height={96}
            className="w-24 h-24 rounded-full mx-auto mb-4"
          />
        )}
        <Button onClick={signOut}>登出</Button>
      </div>
    </div>
  );
}
