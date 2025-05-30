import { ReactNode } from 'react';
import { FinanceBottomNav } from '@/modules/shared/interfaces/navigation/bottom/finance-nav';

export default function FinanceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pb-20">
      {children}
      <FinanceBottomNav />
    </div>
  );
}
