/**
 * 報價單列表頁面
 * 
 * 顯示所有報價單的列表，提供以下功能：
 * - 報價單搜尋
 * - 多欄位排序
 * - PDF 匯出
 * - 報價單詳細資訊查看
 * - 建立日期追蹤
 */

"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { QuotePdfDocument } from '@/components/pdf/QuotePdfDocument';
import { exportPdfToBlob } from '@/components/pdf/pdfExport';
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, doc, getDoc } from "firebase/firestore";
import { QuoteData } from "@/types/finance";

export default function QuotesPage() {
    const { db, isReady } = useAuth();
    const [quotesSnapshot, loading, error] = useCollection(
        isReady ? collection(db, "finance", "default", "quotes") : null
    );
    // 搜尋與排序狀態
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<null | string>(null);
    const [sortAsc, setSortAsc] = useState(true);

    // 處理後的資料
    const rows = useMemo(() => {
        const sortFns: Record<string, (a: Record<string, unknown>, b: Record<string, unknown>) => number> = {
            idx: (a, b) => (a.idx as number) - (b.idx as number),
            quoteName: (a, b) => (a.quoteName as string || "").localeCompare(b.quoteName as string || ""),
            clientName: (a, b) => (a.clientName as string || "").localeCompare(b.clientName as string || ""),
            quotePrice: (a, b) => (Number(a.quotePrice) || 0) - (Number(b.quotePrice) || 0),
            createdAt: (a, b) => ((a.createdAt as Date)?.getTime?.() || 0) - ((b.createdAt as Date)?.getTime?.() || 0),
            updatedAt: (a, b) => ((a.updatedAt as Date)?.getTime?.() || 0) - ((b.updatedAt as Date)?.getTime?.() || 0),
            daysAgo: (a, b) => (a.daysAgo as number || 0) - (b.daysAgo as number || 0),
        };
        if (!quotesSnapshot) return [];
        let arr = quotesSnapshot.docs.map((quote, idx) => {
            const data = quote.data() as QuoteData;
            const createdAtDate = data.createdAt.toDate();
            const updatedAtDate = data.updatedAt.toDate();
            const daysAgo = createdAtDate ? Math.floor((Date.now() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24)) : '-';
            return {
                idx: idx + 1,
                quoteId: data.quoteId || quote.id,
                quoteName: data.quoteName || data.quoteId || quote.id,
                clientName: data.clientName ?? '-',
                quotePrice: data.quotePrice ?? '-',
                createdAt: createdAtDate,
                updatedAt: updatedAtDate,
                daysAgo,
                raw: data,
                docId: quote.id,
            };
        });
        // 搜尋
        if (search.trim()) {
            const s = search.trim().toLowerCase();
            arr = arr.filter(
                (r: Record<string, unknown>) =>
                    String(r.quoteName).toLowerCase().includes(s) ||
                    String(r.clientName).toLowerCase().includes(s)
            );
        }
        // 排序
        if (sortKey && sortFns[sortKey]) {
            arr = [...arr].sort(sortFns[sortKey]);
            if (!sortAsc) arr.reverse();
        }
        return arr;
    }, [quotesSnapshot, search, sortKey, sortAsc]);

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
        if (!isReady) return;

        const docRef = doc(db, "finance", "default", "quotes", String(row.quoteId));
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            alert("找不到該估價單");
            return;
        }
        const data = docSnap.data();
        // 保持原始的 Timestamp 格式，PDF 元件將負責處理
        exportPdfToBlob(
            <QuotePdfDocument quote={data} />,
            `${data.quoteName || data.quoteId || '估價單'}.pdf`
        );
    };

    return (
        <main className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">報價單列表</h1>
                </div>
                <div className="p-6">
                    <div className="mb-6">
                        <input
                            type="text"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-colors duration-200"
                            placeholder="搜尋報價單名稱或客戶名稱"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700/50">
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => handleSort("idx")}>
                                        序號 {sortKey === "idx" ? (sortAsc ? "▲" : "▼") : ""}
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => handleSort("quoteName")}>
                                        報價單名稱 {sortKey === "quoteName" ? (sortAsc ? "▲" : "▼") : ""}
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => handleSort("clientName")}>
                                        客戶名稱 {sortKey === "clientName" ? (sortAsc ? "▲" : "▼") : ""}
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => handleSort("quotePrice")}>
                                        價格 {sortKey === "quotePrice" ? (sortAsc ? "▲" : "▼") : ""}
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => handleSort("createdAt")}>
                                        建立日期 {sortKey === "createdAt" ? (sortAsc ? "▲" : "▼") : ""}
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => handleSort("updatedAt")}>
                                        修改日期 {sortKey === "updatedAt" ? (sortAsc ? "▲" : "▼") : ""}
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => handleSort("daysAgo")}>
                                        建立至今(天) {sortKey === "daysAgo" ? (sortAsc ? "▲" : "▼") : ""}
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {loading ? (
                                    <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">載入中...</td></tr>
                                ) : error ? (
                                    <tr><td colSpan={8} className="px-4 py-8 text-center text-red-500">{String(error)}</td></tr>
                                ) : rows.length > 0 ? (
                                    rows.map((row) => {
                                        const format = (d: Date | null) => d ? d.toLocaleDateString() : '-';
                                        return (
                                            <tr key={row.quoteId as string} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                                                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{row.idx as number}</td>
                                                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{row.quoteName as string}</td>
                                                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{row.clientName as string}</td>
                                                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{row.quotePrice as number}</td>
                                                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{format(row.createdAt as Date | null)}</td>
                                                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{format(row.updatedAt as Date | null)}</td>
                                                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{row.daysAgo as number | string}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <Link 
                                                            href={`/quotes/${row.quoteId}`} 
                                                            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                                                        >
                                                            查看
                                                        </Link>
                                                        <button
                                                            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                                                            onClick={() => handleExportPdf(row)}
                                                        >
                                                            匯出PDF
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">尚無報價單</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}
