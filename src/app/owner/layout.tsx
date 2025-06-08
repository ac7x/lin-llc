"use client";
import { ReactNode } from 'react';
import { OwnerBottomNav } from '@/components/bottom/owner-nav';

export default function OwnerLayout({ children }: { children: ReactNode }) {
    return (
        <div className="pb-20">
            {children}
            <OwnerBottomNav />
        </div>
    );
}
