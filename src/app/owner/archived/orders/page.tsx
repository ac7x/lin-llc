"use client";

import { useEffect, useState } from "react";
import { getArchiveRetentionDays } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

export default function ArchivedOrdersPage() {
    const [archiveRetentionDays, setArchiveRetentionDays] = useState<number>(3650);
    useEffect(() => {
        getArchiveRetentionDays().then(setArchiveRetentionDays);
    }, []);

    // 取得封存訂單
    // 假設 userId 目前為 "default"，可根據登入狀態調整
    const [ordersSnapshot, loading, error] = useCollection(collection(db, "archived/default/orders"));

    return (
        <main className="max-w-2xl mx-auto px-4 py-8">
            {/* 封存自動刪除提示 */}
            <div className="mb-4 p-3 rounded bg-yellow-100 text-yellow-800 border border-yellow-300 text-sm">
                封存文件將於 {archiveRetentionDays} 天（約{' '}
                {Math.round(archiveRetentionDays / 365)} 年）後自動刪除。
            </div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">封存訂單</h1>
            </div>
            <table className="w-full border text-sm">
                <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="border px-2 py-1">序號</th>
                        <th className="border px-2 py-1">訂單名稱</th>
                        <th className="border px-2 py-1">封存日期</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={3} className="text-center py-4">載入中...</td></tr>
                    ) : error ? (
                        <tr><td colSpan={3} className="text-center text-red-500 py-4">{String(error)}</td></tr>
                    ) : ordersSnapshot && ordersSnapshot.docs.length > 0 ? (
                        ordersSnapshot.docs.map((order, idx) => {
                            const data = order.data();
                            const archivedAt = data.archivedAt?.toDate ? data.archivedAt.toDate() : (data.archivedAt ? new Date(data.archivedAt) : null);
                            return (
                                <tr key={data.orderId || order.id}>
                                    <td className="border px-2 py-1 text-center">{idx + 1}</td>
                                    <td className="border px-2 py-1">{data.orderName || data.orderId || order.id}</td>
                                    <td className="border px-2 py-1">{archivedAt ? archivedAt.toLocaleDateString() : '-'}</td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr><td colSpan={3} className="text-center text-gray-400 py-4">尚無封存訂單</td></tr>
                    )}
                </tbody>
            </table>
        </main>
    );
}
