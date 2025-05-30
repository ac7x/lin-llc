"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

export default function OrdersPage() {
    const router = useRouter();
    const [ordersSnapshot, loading, error] = useCollection(collection(db, "orders"));

    return (
        <main className="max-w-2xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">訂單列表</h1>
            </div>
            <table className="w-full border text-sm">
                <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="border px-2 py-1">序號</th>
                        <th className="border px-2 py-1">訂單名稱</th>
                        <th className="border px-2 py-1">價格</th>
                        <th className="border px-2 py-1">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={4} className="text-center py-4">載入中...</td></tr>
                    ) : error ? (
                        <tr><td colSpan={4} className="text-center text-red-500 py-4">{String(error)}</td></tr>
                    ) : ordersSnapshot && ordersSnapshot.docs.length > 0 ? (
                        ordersSnapshot.docs.map((order, idx) => {
                            const data = order.data();
                            return (
                                <tr key={order.id}>
                                    <td className="border px-2 py-1 text-center">{idx + 1}</td>
                                    <td className="border px-2 py-1">{data.name || order.id}</td>
                                    <td className="border px-2 py-1">{data.price ?? '-'}</td>
                                    <td className="border px-2 py-1">
                                        <Link href={`/owner/orders/${order.id}`} className="text-blue-600 hover:underline dark:text-green-400 dark:hover:text-green-300">查看</Link>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr><td colSpan={4} className="text-center text-gray-400 py-4">尚無訂單</td></tr>
                    )}
                </tbody>
            </table>
        </main>
    );
}
