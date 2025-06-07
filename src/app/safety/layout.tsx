"use client";
import { ReactNode } from 'react';
import { SafetyNav } from '@/components/navigation/bottom/safety-nav';

export default function SafetyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pb-16">
      {children}
      <SafetyNav />
    </div>
  );
}