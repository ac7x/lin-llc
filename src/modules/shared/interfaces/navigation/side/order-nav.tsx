"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

export function OrderSideNav() {
    const pathname = usePathname();
    const navs = [
        { label: "訂單列表", href: "/owner/orders" },
        { label: "新增訂單", href: "/owner/orders/add" },
    ];
    const [ordersSnapshot, loading, error] = useCollection(collection(db, "orders"));
    return (
        <nav className="w-48 min-h-screen border-r bg-gray-50 dark:bg-gray-900 p-4">
            <h2 className="text-lg font-bold mb-4">訂單管理</h2>
            <ul className="space-y-2">
                {/* 列表按鈕 */}
                <li key={navs[0].href}>
                    <Link
                        href={navs[0].href}
                        className={`block px-3 py-2 rounded hover:bg-blue-100 dark:hover:bg-gray-800 ${pathname === navs[0].href ? "bg-blue-200 dark:bg-gray-700 font-bold" : ""}`}
                    >
                        {navs[0].label}
                    </Link>
                </li>
                {/* 動態訂單詳情按鈕 */}
                {loading ? (
                    <li className="text-gray-400 px-3 py-2">載入中...</li>
                ) : error ? (
                    <li className="text-red-500 px-3 py-2">{String(error)}</li>
                ) : ordersSnapshot && ordersSnapshot.docs.length > 0 ? (
                    ordersSnapshot.docs.map(order => {
                        const data = order.data();
                        const orderHref = `/owner/orders/${data.orderId || order.id}`;
                        return (
                            <li key={data.orderId || order.id}>
                                <Link
                                    href={orderHref}
                                    className={`block px-3 py-2 rounded hover:bg-blue-100 dark:hover:bg-gray-800 ${pathname === orderHref ? "bg-blue-200 dark:bg-gray-700 font-bold" : ""}`}
                                >
                                    {data.orderName || data.orderId || order.id}
                                </Link>
                            </li>
                        );
                    })
                ) : null}
                {/* 新增按鈕 */}
                <li key={navs[1].href}>
                    <Link
                        href={navs[1].href}
                        className={`block px-3 py-2 rounded hover:bg-blue-100 dark:hover:bg-gray-800 ${pathname === navs[1].href ? "bg-blue-200 dark:bg-gray-700 font-bold" : ""}`}
                    >
                        {navs[1].label}
                    </Link>
                </li>
            </ul>
        </nav>
    );
}
