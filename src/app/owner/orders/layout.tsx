"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/lib/firebase-client";
import { collection } from "firebase/firestore";
import { useEffect } from "react";
import type { OrderData } from "@/types/finance";

const OrderSideNav: React.FC = () => {
    const pathname = usePathname();
    const [ordersSnapshot] = useCollection(collection(db, "orders"));

    const orders = ordersSnapshot?.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as (OrderData & { id: string })[] || [];

    return (
        <nav className="space-y-2">
            <Link
                href="/owner/orders"
                className={`block px-4 py-2 rounded ${
                    pathname === "/owner/orders"
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
            >
                所有訂單
            </Link>
            {orders.map((order) => (
                <Link
                    key={order.id}
                    href={`/owner/orders/${order.id}`}
                    className={`block px-4 py-2 rounded ${
                        pathname === `/owner/orders/${order.id}`
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                >
                    {order.orderName}
                </Link>
            ))}
        </nav>
    );
};

export default function OrdersLayout({ children }: { children: ReactNode }) {
    const { loading, isAuthenticated, hasMinRole } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!isAuthenticated || !hasMinRole("admin"))) {
            router.push("/login");
        }
    }, [loading, isAuthenticated, hasMinRole, router]);

    if (loading) {
        return <div>載入中...</div>;
    }

    if (!isAuthenticated || !hasMinRole("admin")) {
        return null;
    }

    return (
        <div className="flex">
            <div className="w-64 p-4 bg-white dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700">
                <OrderSideNav />
            </div>
            <div className="flex-1">{children}</div>
        </div>
    );
}
