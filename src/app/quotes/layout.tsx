/**
 * 報價單模組布局
 * 
 * 提供報價單相關頁面的共用布局，包含：
 * - 側邊導航選單
 * - 報價單相關功能連結
 * - 響應式設計
 */

"use client";

import React from "react";
import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/lib/firebase-client";
import { collection } from "firebase/firestore";

const QuoteSideNav: React.FC = () => {
    const pathname = usePathname();
    const baseNavs = [
        { label: "報價單列表", href: "/quotes", icon: "📋" },
        { label: "新增報價單", href: "/quotes/add", icon: "➕" },
    ];

    const [quotesSnapshot] = useCollection(collection(db, 'finance', 'default', 'quotes'));

    // 從數據庫獲取報價單列表
    const quoteNavs = quotesSnapshot?.docs.map(doc => ({
        label: doc.data().quoteName || `報價單 ${doc.id}`,
        href: `/quotes/${doc.id}`,
        icon: "📄"
    })) || [];

    // 合併基礎導航和動態報價單導航
    const navs = [
        baseNavs[0],  // 報價單列表
        ...quoteNavs,  // 動態報價單列表
        baseNavs[1]   // 新增報價單
    ];

    return (
        <nav className="space-y-2">
            {navs.map((nav) => (
                <Link
                    key={nav.href}
                    href={nav.href}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        pathname === nav.href
                            ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                >
                    <span className="text-lg">{nav.icon}</span>
                    <span>{nav.label}</span>
                </Link>
            ))}
        </nav>
    );
};

export default function QuotesLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="w-72 p-6 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm">
                <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">報價單管理</h2>
                <QuoteSideNav />
            </div>
            <div className="flex-1 p-6">{children}</div>
        </div>
    );
}