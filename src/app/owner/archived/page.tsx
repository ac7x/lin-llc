"use client";

import { useEffect, useState } from "react";
import { getArchiveRetentionDays } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

export default function ArchivedPage() {
    const [archiveRetentionDays, setArchiveRetentionDays] = useState<number>(3650);

    useEffect(() => {
        getArchiveRetentionDays().then(setArchiveRetentionDays);
    }, []);

    // 模擬封存訂單資料
    const archivedOrders = [
        { id: 'ORD-1001', title: 'Order A', completedAt: '2025-05-20' },
        { id: 'ORD-1002', title: 'Order B', completedAt: '2025-05-22' },
    ]

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
                        <th className="border px-2 py-1">完成日期</th>
                    </tr>
                </thead>
                <tbody>
                    {archivedOrders.length === 0 ? (
                        <tr>
                            <td
                                colSpan={3}
                                className="text-center text-gray-400 py-4"
                            >
                                尚無封存訂單
                            </td>
                        </tr>
                    ) : (
                        archivedOrders.map((order, idx) => (
                            <tr key={order.id}>
                                <td className="border px-2 py-1 text-center">
                                    {idx + 1}
                                </td>
                                <td className="border px-2 py-1">{order.title}</td>
                                <td className="border px-2 py-1">
                                    {order.completedAt}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </main>
    )
}
