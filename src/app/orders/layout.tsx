"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/lib/firebase-client";
import { collection } from "firebase/firestore";

const OrderSideNav: React.FC = () => {
    const pathname = usePathname();
    const baseNavs = [
        { label: "訂單列表", href: "/orders", icon: "📋" },
        { label: "新增訂單", href: "/orders/create", icon: "➕" },
    ];

    const [ordersSnapshot] = useCollection(collection(db, 'finance', 'default', 'orders'));

    // 從數據庫獲取訂單列表
    const orderNavs = ordersSnapshot?.docs.map(doc => ({
        label: doc.data().orderName || `訂單 ${doc.id}`,
        href: `/orders/${doc.id}`,
        icon: "📄"
    })) || [];

    // 合併基礎導航和動態訂單導航
    const navs = [
        baseNavs[0],  // 訂單列表
        ...orderNavs,  // 動態訂單列表
        baseNavs[1]   // 新增訂單
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

export default function OrdersLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="w-72 p-6 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm">
                <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">訂單管理</h2>
                <OrderSideNav />
            </div>
            <div className="flex-1 p-6">{children}</div>
        </div>
    );
}
