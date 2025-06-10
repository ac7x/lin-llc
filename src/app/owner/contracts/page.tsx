"use client";

import Link from "next/link";
import { useCollection } from "react-firebase-hooks/firestore";
import { useMemo, useState } from "react";
import { ContractPdfDocument } from '@/components/pdf/ContractPdfDocument';
import { exportPdfToBlob } from '@/components/pdf/pdfExport';
import QRCode from "qrcode";
import { useFirebase } from "@/hooks/useFirebase";

export default function ContractsPage() {
    const { db, collection, doc, getDoc } = useFirebase();
    const [contractsSnapshot, loading, error] = useCollection(collection(db, "finance", "default", "contracts"));
    const [search, setSearch] = useState("");

    const rows = useMemo(() => {
        if (!contractsSnapshot) return [];
        let arr = contractsSnapshot.docs.map((doc, idx) => {
            const data = doc.data();
            return {
                idx: idx + 1,
                contractId: data.contractId || doc.id,
                contractName: data.contractName || data.contractId || doc.id,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
                sourceType: data.sourceType, // "order" or "quote"
                sourceId: data.sourceId,
                raw: data,
            };
        });
        if (search.trim()) {
            const s = search.trim().toLowerCase();
            arr = arr.filter(
                r =>
                    String(r.contractName).toLowerCase().includes(s) ||
                    String(r.contractId).toLowerCase().includes(s)
            );
        }
        return arr;
    }, [contractsSnapshot, search]);

    // 匯出 PDF
    const handleExportPdf = async (row: Record<string, unknown>) => {
        const docRef = doc(db, "finance", "default", "contracts", String(row.contractId));
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            alert("找不到該合約");
            return;
        }
        const data = docSnap.data();
        data.createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt;
        data.updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt;

        // 產生合約詳情頁網址
        const contractId = String(data.contractId || row.contractId || docRef.id);
        const detailUrl = `${window.location.origin}/owner/contracts/${contractId}`;
        // 產生 QRCode DataURL
        const qrCodeDataUrl = await QRCode.toDataURL(detailUrl, { margin: 1, width: 128 });

        exportPdfToBlob(
            <ContractPdfDocument contract={data} qrCodeDataUrl={qrCodeDataUrl} />, // 傳入 QRCode 圖片
            `${data.contractName || data.contractId || '合約'}.pdf`
        );
    };

    return (
        <main className="max-w-2xl mx-auto px-4 py-8 bg-white dark:bg-neutral-900">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">合約列表</h1>
            <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                合約可由訂單或估價單產生，來源類型會顯示於下方表格。
            </div>
            <div className="mb-4 flex">
                <input
                    type="text"
                    className="border rounded px-2 py-1 w-full bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
                    placeholder="搜尋合約名稱"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            <table className="w-full border text-sm bg-white dark:bg-neutral-900">
                <thead>
                    <tr className="bg-gray-100 dark:bg-neutral-800">
                        <th className="border px-2 py-1">序號</th>
                        <th className="border px-2 py-1">合約名稱</th>
                        <th className="border px-2 py-1">來源</th>
                        <th className="border px-2 py-1">建立日期</th>
                        <th className="border px-2 py-1">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={5} className="text-center py-4">載入中...</td></tr>
                    ) : error ? (
                        <tr><td colSpan={5} className="text-center text-red-500 py-4">{String(error)}</td></tr>
                    ) : rows.length > 0 ? (
                        rows.map(row => (
                            <tr key={row.contractId} className="bg-white dark:bg-neutral-900">
                                <td className="border px-2 py-1 text-center">{row.idx}</td>
                                <td className="border px-2 py-1">{row.contractName}</td>
                                <td className="border px-2 py-1">
                                    {row.sourceType === "order" ? (
                                        <span className="text-blue-600 dark:text-blue-400">訂單</span>
                                    ) : row.sourceType === "quote" ? (
                                        <span className="text-green-600 dark:text-green-400">估價單</span>
                                    ) : (
                                        "-"
                                    )}
                                </td>
                                <td className="border px-2 py-1">{row.createdAt ? row.createdAt.toLocaleDateString() : "-"}</td>
                                <td className="border px-2 py-1">
                                    <Link href={`/owner/contracts/${row.contractId}`} className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">查看</Link>
                                    <button
                                        className="ml-2 text-indigo-600 hover:underline dark:text-yellow-400 dark:hover:text-yellow-300"
                                        onClick={() => handleExportPdf(row)}
                                    >
                                        匯出PDF
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan={5} className="text-center text-gray-400 dark:text-gray-500 py-4">尚無合約</td></tr>
                    )}
                </tbody>
            </table>
        </main>
    );
}
