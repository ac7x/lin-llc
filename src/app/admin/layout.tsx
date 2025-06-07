"use client";

import { AdminBottomNav } from '@/components/navigation/bottom/admin-nav';
import React from "react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="pb-16">
            {children}
            <AdminBottomNav />
        </div>
    );
}
