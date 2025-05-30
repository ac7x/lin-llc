import { ReactNode } from 'react';
import { UserBottomNav } from '@/modules/shared/interfaces/navigation/bottom/user-nav';

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen pb-16">
      {children}
      <UserBottomNav />
    </div>
  );
}