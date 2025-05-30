import { ReactNode } from 'react';
import { OwnerBottomNav } from '@/modules/shared/interfaces/navigation/bottom/owner-nav';

export default function OwnerLayout({ children }: { children: ReactNode }) {
    return (
        <div className="pb-20">
            {children}
            <OwnerBottomNav />
        </div>
    );
}
