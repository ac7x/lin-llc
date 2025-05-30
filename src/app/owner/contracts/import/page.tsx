"use client";

import { useState, useMemo } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, addDoc, Timestamp } from "firebase/firestore";

// 定義 ContractItem 型別
interface ContractItem {
    contractItemId: string;
    contractItemPrice: number;
    contractItemQuantity: number;
    contractItemWeight?: number | null;
}

// 定義 ContractData 型別
interface ContractData {
    contractName: string;
    contractPrice: number;
    contractItems: ContractItem[];
    clientName: string;
    clientContact: string;
    clientPhone: string;
    clientEmail: string;
    createdAt: Date | Timestamp;
    updatedAt: Timestamp;
    sourceType: 'order' | 'quote';
    sourceId: string;
    contractContent: string;
}

export default function ImportContractPage() {
    const [tab, setTab] = useState<'order' | 'quote'>("order");
    const [ordersSnapshot] = useCollection(collection(db, "finance", "default", "orders"));
    const [quotesSnapshot] = useCollection(collection(db, "finance", "default", "quotes"));
    const [importingId, setImportingId] = useState<string | null>(null);
    const [message, setMessage] = useState<string>("");

    // 處理訂單/估價單列表
    const orderRows = useMemo(() => {
        if (!ordersSnapshot) return [];
        return ordersSnapshot.docs.map((doc, idx) => {
            const data = doc.data() as Record<string, unknown>;
            return {
                idx: idx + 1,
                id: (data.orderId as string) || doc.id,
                name: (data.orderName as string) || (data.orderId as string) || doc.id,
                createdAt: (data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt)
                    ? (data.createdAt as Timestamp).toDate()
                    : (data.createdAt ? new Date(data.createdAt as string) : null),
                raw: data,
            };
        });
    }, [ordersSnapshot]);
    const quoteRows = useMemo(() => {
        if (!quotesSnapshot) return [];
        return quotesSnapshot.docs.map((doc, idx) => {
            const data = doc.data() as Record<string, unknown>;
            return {
                idx: idx + 1,
                id: (data.quoteId as string) || doc.id,
                name: (data.quoteName as string) || (data.quoteId as string) || doc.id,
                createdAt: (data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt)
                    ? (data.createdAt as Timestamp).toDate()
                    : (data.createdAt ? new Date(data.createdAt as string) : null),
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
            // 依來源型別轉換合約內容
            let contractData: ContractData;
            if (type === 'order') {
                const orderItems = Array.isArray(row.raw.orderItems)
                    ? (row.raw.orderItems as Array<Record<string, unknown>>).map((item) => ({
                        contractItemId: String(item.orderItemId ?? ''),
                        contractItemPrice: Number(item.orderItemPrice ?? 0),
                        contractItemQuantity: Number(item.orderItemQuantity ?? 0),
                        contractItemWeight: item.orderItemWeight !== undefined ? Number(item.orderItemWeight) : null,
                    }))
                    : [];
                contractData = {
                    contractName: String(row.raw.orderName || row.name),
                    contractPrice: Number(row.raw.orderPrice || 0),
                    contractItems: orderItems,
                    clientName: String(row.raw.clientName || ''),
                    clientContact: String(row.raw.clientContact || ''),
                    clientPhone: String(row.raw.clientPhone || ''),
                    clientEmail: String(row.raw.clientEmail || ''),
                    createdAt: rawCreatedAt as Timestamp | Date,
                    updatedAt: Timestamp.now(),
                    sourceType: 'order',
                    sourceId: row.id,
                    contractContent:
                        `本合約由甲方（本公司）與乙方（${row.raw.clientName || '客戶'}）簽訂，內容如下：\n\n1. 合約名稱：${row.raw.orderName || row.name}\n2. 合約金額：${row.raw.orderPrice || 0} 元\n3. 合約項目：\n${orderItems.map((item, idx) => `   (${idx + 1}) ${item.contractItemId}，單價：${item.contractItemPrice}，數量：${item.contractItemQuantity}`).join('\n')}\n4. 聯絡人：${row.raw.clientContact || ''}\n5. 聯絡電話：${row.raw.clientPhone || ''}\n6. Email：${row.raw.clientEmail || ''}\n\n雙方同意依上述條款履行本合約。`
                };
            } else {
                const quoteItems = Array.isArray(row.raw.quoteItems)
                    ? (row.raw.quoteItems as Array<Record<string, unknown>>).map((item) => ({
                        contractItemId: String(item.quoteItemId ?? ''),
                        contractItemPrice: Number(item.quoteItemPrice ?? 0),
                        contractItemQuantity: Number(item.quoteItemQuantity ?? 0),
                        contractItemWeight: item.quoteItemWeight !== undefined ? Number(item.quoteItemWeight) : null,
                    }))
                    : [];
                contractData = {
                    contractName: String(row.raw.quoteName || row.name),
                    contractPrice: Number(row.raw.quotePrice || 0),
                    contractItems: quoteItems,
                    clientName: String(row.raw.clientName || ''),
                    clientContact: String(row.raw.clientContact || ''),
                    clientPhone: String(row.raw.clientPhone || ''),
                    clientEmail: String(row.raw.clientEmail || ''),
                    createdAt: rawCreatedAt as Timestamp | Date,
                    updatedAt: Timestamp.now(),
                    sourceType: 'quote',
                    sourceId: row.id,
                    contractContent:
                        `本合約由甲方（本公司）與乙方（${row.raw.clientName || '客戶'}）簽訂，內容如下：\n\n1. 合約名稱：${row.raw.quoteName || row.name}\n2. 合約金額：${row.raw.quotePrice || 0} 元\n3. 合約項目：\n${quoteItems.map((item, idx) => `   (${idx + 1}) ${item.contractItemId}，單價：${item.contractItemPrice}，數量：${item.contractItemQuantity}${item.contractItemWeight !== null ? `，權重：${item.contractItemWeight}` : ''}`).join('\n')}\n4. 聯絡人：${row.raw.clientContact || ''}\n5. 聯絡電話：${row.raw.clientPhone || ''}\n6. Email：${row.raw.clientEmail || ''}\n\n雙方同意依上述條款履行本合約。`
                };
            }
            const docRef = await addDoc(collection(db, "finance", "default", "contracts"), contractData);
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
            <div className="mb-4 flex gap-2 border-b border-gray-200 dark:border-neutral-700">
                <button
                    className={`px-4 py-2 font-semibold border-b-2 transition-colors duration-150
                        ${tab === 'order'
                            ? 'border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300 bg-white dark:bg-neutral-900'
                            : 'border-transparent text-gray-600 hover:text-blue-700 dark:text-gray-300 dark:hover:text-blue-400 bg-transparent'}`}
                    onClick={() => setTab('order')}
                >
                    訂單
                </button>
                <button
                    className={`px-4 py-2 font-semibold border-b-2 transition-colors duration-150
                        ${tab === 'quote'
                            ? 'border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300 bg-white dark:bg-neutral-900'
                            : 'border-transparent text-gray-600 hover:text-blue-700 dark:text-gray-300 dark:hover:text-blue-400 bg-transparent'}`}
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
                                        className="bg-blue-500 text-white px-3 py-1 rounded disabled:opacity-50 dark:bg-blue-700 dark:text-gray-200 hover:bg-blue-600 dark:hover:bg-blue-800 transition-colors duration-150"
                                        disabled={!!importingId}
                                        onClick={() => handleImport(row, tab)}
                                    >
                                        {importingId === row.id ? '匯入中...' : '匯入生成合約'}
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </main>
    );
}
