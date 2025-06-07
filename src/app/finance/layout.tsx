"use client";

import { FinanceBottomNav } from '@/components/navigation/bottom/finance-nav';
import React from "react";

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pb-16">
      {children}
      <FinanceBottomNav />
    </div>
  );
}
