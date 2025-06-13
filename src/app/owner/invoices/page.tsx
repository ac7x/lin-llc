"use client";

import { useState, useMemo } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { InvoicePdfDocument } from '@/components/pdf/InvoicePdfDocument';
import { exportPdfToBlob } from '@/components/pdf/pdfExport';
import QRCode from "qrcode";

export default function InvoicePage() {
    const { db, collection, doc, getDoc } = useAuth();
    const [invoicesSnapshot, loading, error] = useCollection(collection(db, "finance", "default", "invoices"));
    const [search, setSearch] = useState("");

    const rows = useMemo(() => {
        if (!invoicesSnapshot) return [];
        let arr = invoicesSnapshot.docs.map((doc, idx) => {
            const data = doc.data();
            return {
                idx: idx + 1,
                invoiceId: data.invoiceId || doc.id,
                invoiceName: data.invoiceName || data.invoiceId || doc.id,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
                sourceType: data.sourceType, // "order" or "quote" or "contract"
                sourceId: data.sourceId,
                raw: data,
            };
        });
        if (search.trim()) {
            const s = search.trim().toLowerCase();
            arr = arr.filter(
                r =>
                    String(r.invoiceName).toLowerCase().includes(s) ||
                    String(r.invoiceId).toLowerCase().includes(s)
            );
        }
        return arr;
    }, [invoicesSnapshot, search]);

    // 匯出 PDF
    const handleExportPdf = async (row: Record<string, unknown>) => {
        const docRef = doc(db, "finance", "default", "invoices", String(row.invoiceId));
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            alert("找不到該發票");
            return;
        }
        const data = docSnap.data();
        data.createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt;
        data.updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt;

        // 產生發票詳情頁網址
        const invoiceId = String(data.invoiceId || row.invoiceId || docRef.id);
        const detailUrl = `${window.location.origin}/owner/invoices/${invoiceId}`;
        // 產生 QRCode DataURL
        const qrCodeDataUrl = await QRCode.toDataURL(detailUrl, { margin: 1, width: 128 });

        exportPdfToBlob(
            <InvoicePdfDocument invoice={data} qrCodeDataUrl={qrCodeDataUrl} />,
            `${data.invoiceName || data.invoiceId || '發票'}.pdf`
        );
    };

    return (
        <main className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">發票列表</h1>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        發票可由訂單、估價單或合約產生，來源類型會顯示於下方表格。
                    </div>
                </div>
                <div className="p-6">
                    <div className="mb-6">
                        <input
                            type="text"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-colors duration-200"
                            placeholder="搜尋發票名稱"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700/50">
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">序號</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">發票名稱</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">來源</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">建立日期</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {loading ? (
                                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">載入中...</td></tr>
                                ) : error ? (
                                    <tr><td colSpan={5} className="px-4 py-8 text-center text-red-500">{String(error)}</td></tr>
                                ) : rows.length > 0 ? (
                                    rows.map(row => (
                                        <tr key={row.invoiceId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                                            <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{row.idx}</td>
                                            <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{row.invoiceName}</td>
                                            <td className="px-4 py-3">
                                                {row.sourceType === "order" ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">訂單</span>
                                                ) : row.sourceType === "quote" ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">估價單</span>
                                                ) : row.sourceType === "contract" ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">合約</span>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{row.createdAt ? row.createdAt.toLocaleDateString() : "-"}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Link 
                                                        href={`/owner/invoices/${row.invoiceId}`} 
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
                                    ))
                                ) : (
                                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">尚無發票</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}
