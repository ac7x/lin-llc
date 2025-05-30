"use client";

import Link from "next/link";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { useState, useMemo } from "react";

export default function OrdersPage() {
    const [ordersSnapshot, loading, error] = useCollection(collection(db, "orders"));
    // 搜尋與排序狀態
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<null | string>(null);
    const [sortAsc, setSortAsc] = useState(true);

    // 排序函數
    const sortFns: Record<string, (a: Record<string, unknown>, b: Record<string, unknown>) => number> = {
        idx: (a, b) => (a.idx as number) - (b.idx as number),
        orderName: (a, b) => (a.orderName as string || "").localeCompare(b.orderName as string || ""),
        clientName: (a, b) => (a.clientName as string || "").localeCompare(b.clientName as string || ""),
        orderPrice: (a, b) => (Number(a.orderPrice) || 0) - (Number(b.orderPrice) || 0),
        createdAt: (a, b) => ((a.createdAt as Date)?.getTime?.() || 0) - ((b.createdAt as Date)?.getTime?.() || 0),
        updatedAt: (a, b) => ((a.updatedAt as Date)?.getTime?.() || 0) - ((b.updatedAt as Date)?.getTime?.() || 0),
        daysAgo: (a, b) => (a.daysAgo as number || 0) - (b.daysAgo as number || 0),
    };

    // 處理後的資料
    const rows = useMemo(() => {
        if (!ordersSnapshot) return [];
        let arr = ordersSnapshot.docs.map((order, idx) => {
            const data = order.data();
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : null);
            const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : null);
            const daysAgo = createdAt ? Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)) : '-';
            return {
                idx: idx + 1,
                orderId: data.orderId || order.id,
                orderName: data.orderName || data.orderId || order.id,
                clientName: data.clientName ?? '-',
                orderPrice: data.orderPrice ?? '-',
                createdAt,
                updatedAt,
                daysAgo,
                raw: data,
                docId: order.id,
            };
        });
        // 搜尋
        if (search.trim()) {
            const s = search.trim().toLowerCase();
            arr = arr.filter(
                r =>
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
    }, [ordersSnapshot, search, sortKey, sortAsc, sortFns]);

    // 排序點擊
    const handleSort = (key: string) => {
        if (sortKey === key) setSortAsc(!sortAsc);
        else {
            setSortKey(key);
            setSortAsc(true);
        }
    };

    return (
        <main className="max-w-2xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">訂單列表</h1>
            </div>
            {/* 搜尋框 */}
            <div className="mb-4 flex">
                <input
                    type="text"
                    className="border rounded px-2 py-1 w-full"
                    placeholder="搜尋訂單名稱或客戶名稱"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            <table className="w-full border text-sm">
                <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort("idx")}>
                            序號 {sortKey === "idx" ? (sortAsc ? "▲" : "▼") : ""}
                        </th>
                        <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort("orderName")}>
                            訂單名稱 {sortKey === "orderName" ? (sortAsc ? "▲" : "▼") : ""}
                        </th>
                        <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort("clientName")}>
                            客戶名稱 {sortKey === "clientName" ? (sortAsc ? "▲" : "▼") : ""}
                        </th>
                        <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort("orderPrice")}>
                            價格 {sortKey === "orderPrice" ? (sortAsc ? "▲" : "▼") : ""}
                        </th>
                        <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort("createdAt")}>
                            建立日期 {sortKey === "createdAt" ? (sortAsc ? "▲" : "▼") : ""}
                        </th>
                        <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort("updatedAt")}>
                            修改日期 {sortKey === "updatedAt" ? (sortAsc ? "▲" : "▼") : ""}
                        </th>
                        <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort("daysAgo")}>
                            建立至今(天) {sortKey === "daysAgo" ? (sortAsc ? "▲" : "▼") : ""}
                        </th>
                        <th className="border px-2 py-1">操作</th>
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
                                <tr key={row.orderId}>
                                    <td className="border px-2 py-1 text-center">{row.idx}</td>
                                    <td className="border px-2 py-1">{row.orderName}</td>
                                    <td className="border px-2 py-1">{row.clientName}</td>
                                    <td className="border px-2 py-1">{row.orderPrice}</td>
                                    <td className="border px-2 py-1">{format(row.createdAt)}</td>
                                    <td className="border px-2 py-1">{format(row.updatedAt)}</td>
                                    <td className="border px-2 py-1 text-center">{row.daysAgo}</td>
                                    <td className="border px-2 py-1">
                                        <Link href={`/owner/orders/${row.orderId}`} className="text-blue-600 hover:underline dark:text-green-400 dark:hover:text-green-300">查看</Link>
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
