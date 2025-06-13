"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { OrderPdfDocument } from '@/components/pdf/OrderPdfDocument';
import { exportPdfToBlob } from '@/components/pdf/pdfExport';
import { useAuth } from "@/hooks/useAuth";
import { useCollection } from "react-firebase-hooks/firestore";
import { OrderData } from "@/types/finance";

export default function OrdersPage() {
    const { db, collection, doc, getDoc } = useAuth();
    const [ordersSnapshot, loading, error] = useCollection(
        collection(db, "finance", "default", "orders")
    );
    // 搜尋與排序狀態
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<null | string>(null);
    const [sortAsc, setSortAsc] = useState(true);

    // 處理後的資料
    const rows = useMemo(() => {
        // 排序函數移到 useMemo 內部
        const sortFns: Record<string, (a: Record<string, unknown>, b: Record<string, unknown>) => number> = {
            idx: (a, b) => (a.idx as number) - (b.idx as number),
            orderName: (a, b) => (a.orderName as string || "").localeCompare(b.orderName as string || ""),
            clientName: (a, b) => (a.clientName as string || "").localeCompare(b.clientName as string || ""),
            orderPrice: (a, b) => (Number(a.orderPrice) || 0) - (Number(b.orderPrice) || 0),
            createdAt: (a, b) => ((a.createdAt as Date)?.getTime?.() || 0) - ((b.createdAt as Date)?.getTime?.() || 0),
            updatedAt: (a, b) => ((a.updatedAt as Date)?.getTime?.() || 0) - ((b.updatedAt as Date)?.getTime?.() || 0),
            daysAgo: (a, b) => (a.daysAgo as number || 0) - (b.daysAgo as number || 0),
        };
        if (!ordersSnapshot) return [];
        let arr = ordersSnapshot.docs.map((order, idx) => {
            // 型別明確化
            const data = order.data() as OrderData;
            const createdAtDate = data.createdAt.toDate();
            const updatedAtDate = data.updatedAt.toDate();
            const daysAgo = createdAtDate ? Math.floor((Date.now() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24)) : '-';
            return {
                idx: idx + 1,
                orderId: data.orderId || order.id,
                orderName: data.orderName || data.orderId || order.id,
                clientName: data.clientName ?? '-',
                orderPrice: data.orderPrice ?? '-',
                createdAt: createdAtDate,
                updatedAt: updatedAtDate,
                daysAgo,
                raw: data,
                docId: order.id,
            };
        });
        // 搜尋
        if (search.trim()) {
            const s = search.trim().toLowerCase();
            arr = arr.filter(
                (r: Record<string, unknown>) =>
                    String(r.orderName).toLowerCase().includes(s) ||
                    String(r.clientName).toLowerCase().includes(s)
            );
        }
        // 排序
        if (sortKey && sortFns[sortKey]) {
            arr = [...arr].sort(sortFns[sortKey]);
            if (!sortAsc) arr.reverse();
        }
        return arr;
    }, [ordersSnapshot, search, sortKey, sortAsc]);

    // 排序點擊
    const handleSort = (key: string) => {
        if (sortKey === key) setSortAsc(!sortAsc);
        else {
            setSortKey(key);
            setSortAsc(true);
        }
    };

    // 匯出 PDF
    const handleExportPdf = async (row: Record<string, unknown>) => {
        const docRef = doc(db, "finance", "default", "orders", String(row.orderId));
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            alert("找不到該訂單");
            return;
        }
        const data = docSnap.data();
        // 保持原始的 Timestamp 格式，PDF 元件將負責處理
        exportPdfToBlob(
            <OrderPdfDocument order={data} />,
            `${data.orderName || data.orderId || '訂單'}.pdf`
        );
    };

    return (
        <main className="max-w-2xl mx-auto px-4 py-8 bg-white dark:bg-gray-900 text-black dark:text-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">訂單列表</h1>
            </div>
            {/* 搜尋框 */}
            <div className="mb-4 flex">
                <input
                    type="text"
                    className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700"
                    placeholder="搜尋訂單名稱或客戶名稱"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            <table className="w-full border text-sm border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
                <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="border px-2 py-1 cursor-pointer border-gray-300 dark:border-gray-700" onClick={() => handleSort("idx")}>
                            序號 {sortKey === "idx" ? (sortAsc ? "▲" : "▼") : ""}
                        </th>
                        <th className="border px-2 py-1 cursor-pointer border-gray-300 dark:border-gray-700" onClick={() => handleSort("orderName")}>
                            訂單名稱 {sortKey === "orderName" ? (sortAsc ? "▲" : "▼") : ""}
                        </th>
                        <th className="border px-2 py-1 cursor-pointer border-gray-300 dark:border-gray-700" onClick={() => handleSort("clientName")}>
                            客戶名稱 {sortKey === "clientName" ? (sortAsc ? "▲" : "▼") : ""}
                        </th>
                        <th className="border px-2 py-1 cursor-pointer border-gray-300 dark:border-gray-700" onClick={() => handleSort("orderPrice")}>
                            價格 {sortKey === "orderPrice" ? (sortAsc ? "▲" : "▼") : ""}
                        </th>
                        <th className="border px-2 py-1 cursor-pointer border-gray-300 dark:border-gray-700" onClick={() => handleSort("createdAt")}>
                            建立日期 {sortKey === "createdAt" ? (sortAsc ? "▲" : "▼") : ""}
                        </th>
                        <th className="border px-2 py-1 cursor-pointer border-gray-300 dark:border-gray-700" onClick={() => handleSort("updatedAt")}>
                            修改日期 {sortKey === "updatedAt" ? (sortAsc ? "▲" : "▼") : ""}
                        </th>
                        <th className="border px-2 py-1 cursor-pointer border-gray-300 dark:border-gray-700" onClick={() => handleSort("daysAgo")}>
                            建立至今(天) {sortKey === "daysAgo" ? (sortAsc ? "▲" : "▼") : ""}
                        </th>
                        <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={8} className="text-center py-4">載入中...</td></tr>
                    ) : error ? (
                        <tr><td colSpan={8} className="text-center text-red-500 py-4">{String(error)}</td></tr>
                    ) : rows.length > 0 ? (
                        rows.map((row) => {
                            const format = (d: Date | null) => d ? d.toLocaleDateString() : '-';
                            return (
                                <tr key={row.orderId as string} className="bg-white dark:bg-gray-900">
                                    <td className="border px-2 py-1 text-center border-gray-300 dark:border-gray-700">{row.idx as number}</td>
                                    <td className="border px-2 py-1 border-gray-300 dark:border-gray-700">{row.orderName as string}</td>
                                    <td className="border px-2 py-1 border-gray-300 dark:border-gray-700">{row.clientName as string}</td>
                                    <td className="border px-2 py-1 border-gray-300 dark:border-gray-700">{row.orderPrice as number}</td>
                                    <td className="border px-2 py-1 border-gray-300 dark:border-gray-700">{format(row.createdAt as Date | null)}</td>
                                    <td className="border px-2 py-1 border-gray-300 dark:border-gray-700">{format(row.updatedAt as Date | null)}</td>
                                    <td className="border px-2 py-1 text-center border-gray-300 dark:border-gray-700">{row.daysAgo as number | string}</td>
                                    <td className="border px-2 py-1 border-gray-300 dark:border-gray-700">
                                        <Link href={`/owner/orders/${row.orderId}`} className="text-blue-600 hover:underline dark:text-green-400 dark:hover:text-green-300">查看</Link>
                                        <button
                                            className="ml-2 text-indigo-600 hover:underline dark:text-yellow-400 dark:hover:text-yellow-300"
                                            onClick={() => handleExportPdf(row)}
                                        >
                                            匯出PDF
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr><td colSpan={8} className="text-center text-gray-400 py-4">尚無訂單</td></tr>
                    )}
                </tbody>
            </table>
        </main>
    );
}
