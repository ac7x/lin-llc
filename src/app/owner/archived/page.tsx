// src/app/owner/archived/page.tsx

import { Metadata } from 'next'
import ArchivedNav from '@/modules/shared/interfaces/navigation/side/archived-nav'

export const metadata: Metadata = {
    title: '封存訂單',
    description: '在此檢視已完成與封存的訂單。',
}

export default function ArchivedPage() {
    // 模擬封存訂單資料
    const archivedOrders = [
        { id: 'ORD-1001', title: 'Order A', completedAt: '2025-05-20' },
        { id: 'ORD-1002', title: 'Order B', completedAt: '2025-05-22' },
    ]

    return (
        <main className="max-w-2xl mx-auto px-4 py-8">
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
