"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/lib/firebase-client";
import { collection } from "firebase/firestore";
import type { InvoiceData } from '@/types/finance';

const InvoiceNav: React.FC = () => {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const navs = [
        { label: "發票列表", href: "/owner/invoices" },
        { label: "新增發票", href: "/owner/invoices/create" },
    ];

    const [invoicesSnapshot] = useCollection(collection(db, 'finance', 'default', 'invoice'));

    return (
        <nav className="space-y-1">
            {navs.map((nav) => (
                <Link
                    key={nav.href}
                    href={nav.href}
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                        pathname === nav.href
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                >
                    {nav.label}
                </Link>
            ))}
        </nav>
    );
};

export default InvoiceNav;
