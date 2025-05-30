"use client";

import Link from "next/link";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

export default function QuotesPage() {
    const [quotesSnapshot, loading, error] = useCollection(collection(db, "quotes"));

    return (
        <main className="max-w-2xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">估價單列表</h1>
            </div>
            <table className="w-full border text-sm">
                <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="border px-2 py-1">序號</th>
                        <th className="border px-2 py-1">估價單名稱</th>
                        <th className="border px-2 py-1">價格</th>
                        <th className="border px-2 py-1">建立日期</th>
                        <th className="border px-2 py-1">修改日期</th>
                        <th className="border px-2 py-1">建立至今(天)</th>
                        <th className="border px-2 py-1">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={7} className="text-center py-4">載入中...</td></tr>
                    ) : error ? (
                        <tr><td colSpan={7} className="text-center text-red-500 py-4">{String(error)}</td></tr>
                    ) : quotesSnapshot && quotesSnapshot.docs.length > 0 ? (
                        quotesSnapshot.docs.map((quote, idx) => {
                            const data = quote.data();
                            // Firestore Timestamp 轉 JS Date
                            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : null);
                            const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : null);
                            // 日期格式
                            const format = (d: Date | null) => d ? d.toLocaleDateString() : '-';
                            // 計算天數
                            const daysAgo = createdAt ? Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)) : '-';
                            return (
                                <tr key={data.quoteId || quote.id}>
                                    <td className="border px-2 py-1 text-center">{idx + 1}</td>
                                    <td className="border px-2 py-1">{data.quoteName || data.quoteId || quote.id}</td>
                                    <td className="border px-2 py-1">{data.quotePrice ?? '-'}</td>
                                    <td className="border px-2 py-1">{format(createdAt)}</td>
                                    <td className="border px-2 py-1">{format(updatedAt)}</td>
                                    <td className="border px-2 py-1 text-center">{daysAgo}</td>
                                    <td className="border px-2 py-1">
                                        <Link href={`/owner/quotes/${data.quoteId || quote.id}`} className="text-blue-600 hover:underline dark:text-green-400 dark:hover:text-green-300">查看</Link>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr><td colSpan={7} className="text-center text-gray-400 py-4">尚無估價單</td></tr>
                    )}
                </tbody>
            </table>
        </main>
    );
}
