"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/lib/firebase-client";
import { collection } from "firebase/firestore";

const QuoteSideNav: React.FC = () => {
    const { user } = useAuth();
    const pathname = usePathname();
    const baseNavs = [
        { label: "報價單列表", href: "/owner/quotes" },
        { label: "新增報價單", href: "/owner/quotes/add" },
    ];

    const [quotesSnapshot] = useCollection(collection(db, 'finance', 'default', 'quotes'));

    // 從數據庫獲取報價單列表
    const quoteNavs = quotesSnapshot?.docs.map(doc => ({
        label: doc.data().quoteName || `報價單 ${doc.id}`,
        href: `/owner/quotes/${doc.id}`
    })) || [];

    // 合併基礎導航和動態報價單導航
    const navs = [
        baseNavs[0],  // 報價單列表
        ...quoteNavs,  // 動態報價單列表
        baseNavs[1]   // 新增報價單
    ];

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

export default function QuotesLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex">
            <QuoteSideNav />
            <div className="flex-1 p-4">{children}</div>
        </div>
    );
}