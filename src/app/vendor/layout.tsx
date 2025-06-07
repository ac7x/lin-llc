"use client";
import { ReactNode } from 'react';
import VendorNav from '@/components/navigation/bottom/vendor-nav';

export default function VendorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen pb-16">
      {children}
      <VendorNav />
    </div>
  );
}