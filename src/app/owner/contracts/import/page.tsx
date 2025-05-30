"use client";

import { useState, useMemo } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import Link from "next/link";

// 定義 ContractData 型別
interface ContractData {
    contractName: string;
    createdAt: Date | Timestamp;
    updatedAt: Timestamp;
    sourceType: 'order' | 'quote';
    sourceId: string;
    contractContent: string;
}

export default function ImportContractPage() {
    const [tab, setTab] = useState<'order' | 'quote'>("order");
    const [ordersSnapshot] = useCollection(collection(db, "orders"));
    const [quotesSnapshot] = useCollection(collection(db, "quotes"));
    const [importingId, setImportingId] = useState<string | null>(null);
    const [message, setMessage] = useState<string>("");

    // 處理訂單/估價單列表
    const orderRows = useMemo(() => {
        if (!ordersSnapshot) return [];
        return ordersSnapshot.docs.map((doc, idx) => {
            const data = doc.data();
            return {
                idx: idx + 1,
                id: data.orderId || doc.id,
                name: data.orderName || data.orderId || doc.id,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : null),
                raw: data,
            };
        });
    }, [ordersSnapshot]);
    const quoteRows = useMemo(() => {
        if (!quotesSnapshot) return [];
        return quotesSnapshot.docs.map((doc, idx) => {
            const data = doc.data();
            return {
                idx: idx + 1,
                id: data.quoteId || doc.id,
                name: data.quoteName || data.quoteId || doc.id,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : null),
                raw: data,
            };
        });
    }, [quotesSnapshot]);

    // 匯入生成合約
    const handleImport = async (
        row: {
            id: string;
            name: string;
            createdAt: Date | null;
            raw: Record<string, unknown>;
        },
        type: 'order' | 'quote'
    ) => {
        setImportingId(row.id);
        setMessage("");
        try {
            // 檢查 createdAt 必須存在且型別正確
            const rawCreatedAt = row.raw.createdAt;
            if (!rawCreatedAt || !(rawCreatedAt instanceof Timestamp || rawCreatedAt instanceof Date)) {
                setImportingId(null);
                setMessage("來源資料缺少正確的建立日期，無法建立合約。");
                throw new Error("來源資料缺少正確的建立日期，無法建立合約。");
            }
            const contractData: ContractData = {
                contractName: row.name,
                createdAt: rawCreatedAt as Timestamp | Date,
                updatedAt: Timestamp.now(),
                sourceType: type,
                sourceId: row.id,
                contractContent: '',
            };
            // 可根據需要帶入更多欄位
            if (type === 'order') {
                contractData.contractContent = `訂單內容：\n${JSON.stringify(row.raw, null, 2)}`;
            } else {
                contractData.contractContent = `估價單內容：\n${JSON.stringify(row.raw, null, 2)}`;
            }
            const docRef = await addDoc(collection(db, "contracts"), contractData);
            setMessage(`已成功匯入並建立合約，ID: ${docRef.id}`);
        } catch (err) {
            setMessage("匯入失敗: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setImportingId(null);
        }
    };

    return (
        <main className="max-w-2xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">從訂單/估價單匯入生成合約</h1>
            <div className="mb-4 flex gap-2">
                <button
                    className={`px-4 py-2 rounded ${tab === 'order' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    onClick={() => setTab('order')}
                >
                    訂單
                </button>
                <button
                    className={`px-4 py-2 rounded ${tab === 'quote' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    onClick={() => setTab('quote')}
                >
                    估價單
                </button>
            </div>
            {message && <div className="mb-4 text-green-600">{message}</div>}
            <table className="w-full border text-sm">
                <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="border px-2 py-1">序號</th>
                        <th className="border px-2 py-1">名稱</th>
                        <th className="border px-2 py-1">建立日期</th>
                        <th className="border px-2 py-1">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {(tab === 'order' ? orderRows : quoteRows).length === 0 ? (
                        <tr><td colSpan={4} className="text-center text-gray-400 py-4">尚無資料</td></tr>
                    ) : (
                        (tab === 'order' ? orderRows : quoteRows).map(row => (
                            <tr key={row.id}>
                                <td className="border px-2 py-1 text-center">{row.idx}</td>
                                <td className="border px-2 py-1">{row.name}</td>
                                <td className="border px-2 py-1">{row.createdAt ? row.createdAt.toLocaleDateString() : '-'}</td>
                                <td className="border px-2 py-1">
                                    <button
                                        className="bg-blue-500 text-white px-3 py-1 rounded disabled:opacity-50"
                                        disabled={!!importingId}
                                        onClick={() => handleImport(row, tab)}
                                    >
                                        {importingId === row.id ? '匯入中...' : '匯入生成合約'}
                                    </button>
                                    <Link href={`/${tab === 'order' ? 'owner/orders' : 'owner/quotes'}/${row.id}`} className="ml-2 text-blue-600 underline">查看</Link>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </main>
    );
}
