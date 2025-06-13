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
        { label: "訂單列表", href: "/owner/orders" },
        { label: "新增訂單", href: "/owner/orders/create" },
    ];

    const [ordersSnapshot] = useCollection(collection(db, 'finance', 'default', 'orders'));

    // 從數據庫獲取訂單列表
    const orderNavs = ordersSnapshot?.docs.map(doc => ({
        label: doc.data().orderName || `訂單 ${doc.id}`,
        href: `/owner/orders/${doc.id}`
    })) || [];

    // 合併基礎導航和動態訂單導航
    const navs = [
        baseNavs[0],  // 訂單列表
        ...orderNavs,  // 動態訂單列表
        baseNavs[1]   // 新增訂單
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

export default function OrdersLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex">
            <OrderSideNav />
            <div className="flex-1 p-4">{children}</div>
        </div>
    );
}
