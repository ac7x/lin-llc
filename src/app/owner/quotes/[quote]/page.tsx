"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { useDocument } from "react-firebase-hooks/firestore";

// 項目型別
interface QuoteItem {
    quoteItemId: string;
    quoteItemPrice: number;
    quoteItemQuantity: number;
    quoteItemWeight?: number; // 權重 (0~1)
}

export default function QuoteDetailPage() {
    const router = useRouter();
    const params = useParams();
    const quoteId = params?.quote as string;
    const [quoteName, setQuoteName] = useState("");
    const [quotePrice, setQuotePrice] = useState(0);
    const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
    const [clientName, setClientName] = useState("");
    const [clientContact, setClientContact] = useState("");
    const [clientPhone, setClientPhone] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editing, setEditing] = useState(false);
    const [editQuoteName, setEditQuoteName] = useState("");
    const [editQuotePrice, setEditQuotePrice] = useState(0);
    const [editQuoteItems, setEditQuoteItems] = useState<QuoteItem[]>([]);
    const [editClientName, setEditClientName] = useState("");
    const [editClientContact, setEditClientContact] = useState("");
    const [editClientPhone, setEditClientPhone] = useState("");
    const [editClientEmail, setEditClientEmail] = useState("");

    // Firestore hooks 實現同步數據
    const [quoteDoc] = useDocument(quoteId ? doc(db, "finance", "default", "quotes", quoteId) : null);

    useEffect(() => {
        if (!quoteId) return;
        if (quoteDoc) {
            if (!quoteDoc.exists()) {
                setError("找不到估價單");
                setLoading(false);
                return;
            }
            const data = quoteDoc.data();
            setQuoteName(data.quoteName || "");
            setQuotePrice(data.quotePrice || 0);
            setQuoteItems(Array.isArray(data.quoteItems) ? data.quoteItems : []);
            setClientName(data.clientName || "");
            setClientContact(data.clientContact || "");
            setClientPhone(data.clientPhone || "");
            setClientEmail(data.clientEmail || "");
            // 編輯狀態初始化
            setEditQuoteName(data.quoteName || "");
            setEditQuotePrice(data.quotePrice || 0);
            setEditQuoteItems(Array.isArray(data.quoteItems) ? data.quoteItems : []);
            setEditClientName(data.clientName || "");
            setEditClientContact(data.clientContact || "");
            setEditClientPhone(data.clientPhone || "");
            setEditClientEmail(data.clientEmail || "");
            setLoading(false);
        }
    }, [quoteId, quoteDoc]);

    // 權重與單價
    const getWeight = (price: number) => (quotePrice ? price / quotePrice : 0);
    const getUnitPrice = (item: QuoteItem) => (item.quoteItemQuantity ? (item.quoteItemPrice / item.quoteItemQuantity).toFixed(2) : "0.00");

    // 編輯用操作
    const handleEditItemChange = (idx: number, key: keyof QuoteItem, value: string | number) => {
        setEditQuoteItems(items => items.map((item, i) => i === idx ? { ...item, [key]: value } : item));
    };
    const addEditItem = () => setEditQuoteItems([...editQuoteItems, { quoteItemId: "", quoteItemPrice: 0, quoteItemQuantity: 1 }]);
    const removeEditItem = (idx: number) => setEditQuoteItems(items => items.filter((_, i) => i !== idx));

    // 儲存編輯
    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await import("firebase/firestore").then(({ updateDoc, doc }) =>
                updateDoc(doc(db, "finance", "default", "quotes", quoteId), {
                    quoteName: editQuoteName,
                    quotePrice: editQuotePrice,
                    quoteItems: editQuoteItems.map((item, idx) => ({
                        ...item,
                        quoteItemId: item.quoteItemId || String(idx + 1),
                    })),
                    clientName: editClientName,
                    clientContact: editClientContact,
                    clientPhone: editClientPhone,
                    clientEmail: editClientEmail,
                    updatedAt: new Date(),
                })
            );
            setQuoteName(editQuoteName);
            setQuotePrice(editQuotePrice);
            setQuoteItems(editQuoteItems);
            setClientName(editClientName);
            setClientContact(editClientContact);
            setClientPhone(editClientPhone);
            setClientEmail(editClientEmail);
            setEditing(false);
        } catch (err) {
            alert("儲存失敗: " + (err instanceof Error ? err.message : String(err)));
        }
    };

    return (
        <main className="max-w-xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">估價單詳情</h1>
            {loading ? (
                <div className="text-center py-8">載入中...</div>
            ) : error ? (
                <div className="text-center text-red-500 py-8">{error}</div>
            ) : editing ? (
                <form onSubmit={handleSaveEdit}>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block font-medium mb-1">估價單名稱：</label>
                            <input
                                type="text"
                                className="border px-2 py-1 rounded w-full"
                                value={editQuoteName}
                                onChange={e => setEditQuoteName(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">估價金額：</label>
                            <input
                                type="number"
                                className="border px-2 py-1 rounded w-full"
                                value={editQuotePrice}
                                min={0}
                                onChange={e => setEditQuotePrice(Number(e.target.value))}
                                required
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">客戶名稱：</label>
                            <input
                                type="text"
                                className="border px-2 py-1 rounded w-full"
                                value={editClientName}
                                onChange={e => setEditClientName(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block font-medium mb-1">聯絡人：</label>
                            <input
                                type="text"
                                className="border px-2 py-1 rounded w-full"
                                value={editClientContact}
                                onChange={e => setEditClientContact(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">電話：</label>
                            <input
                                type="text"
                                className="border px-2 py-1 rounded w-full"
                                value={editClientPhone}
                                onChange={e => setEditClientPhone(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Email：</label>
                            <input
                                type="email"
                                className="border px-2 py-1 rounded w-full"
                                value={editClientEmail}
                                onChange={e => setEditClientEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    {/* 估價項目編輯 */}
                    <div className="mb-4">
                        <label className="block font-medium mb-2">估價項目：</label>
                        <table className="w-full border text-sm mb-2">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-800">
                                    <th className="border px-2 py-1">項目名稱</th>
                                    <th className="border px-2 py-1">金額</th>
                                    <th className="border px-1 py-1">數量</th>
                                    <th className="border px-2 py-1 min-w-[90px]">權重</th>
                                    <th className="border px-2 py-1">單價</th>
                                    <th className="border px-1 py-1"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {editQuoteItems.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="border px-2 py-1">
                                            <input
                                                type="text"
                                                className="border px-2 py-1 rounded w-full"
                                                value={item.quoteItemId}
                                                onChange={e => handleEditItemChange(idx, "quoteItemId", e.target.value)}
                                                required
                                            />
                                        </td>
                                        <td className="border px-2 py-1">
                                            <input
                                                type="number"
                                                className="border px-2 py-1 rounded w-full"
                                                value={item.quoteItemPrice}
                                                min={0}
                                                onChange={e => handleEditItemChange(idx, "quoteItemPrice", Number(e.target.value))}
                                                required
                                            />
                                        </td>
                                        <td className="border px-1 py-1">
                                            <input
                                                type="number"
                                                className="border px-1 py-1 rounded w-full"
                                                value={item.quoteItemQuantity}
                                                min={1}
                                                onChange={e => handleEditItemChange(idx, "quoteItemQuantity", Number(e.target.value))}
                                                required
                                            />
                                        </td>
                                        <td className="border px-2 py-1">
                                            <input
                                                type="number"
                                                className="border px-2 py-1 rounded w-full"
                                                value={item.quoteItemWeight ?? getWeight(item.quoteItemPrice)}
                                                min={0}
                                                max={1}
                                                step={0.01}
                                                onChange={e => handleEditItemChange(idx, "quoteItemWeight", Number(e.target.value))}
                                            />
                                        </td>
                                        <td className="border px-2 py-1 text-center">{getUnitPrice(item)}</td>
                                        <td className="border px-1 py-1 text-center">
                                            <button
                                                type="button"
                                                title="刪除"
                                                className="text-red-500 p-0 m-0 leading-none text-lg"
                                                onClick={() => removeEditItem(idx)}
                                                disabled={editQuoteItems.length === 1}
                                                style={{ lineHeight: 1 }}
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {/* 權重總和與總金額同一行，貼齊表格右側 */}
                        <div className="mt-2 flex justify-end gap-4 text-sm">
                            <span>
                                <span className="font-bold">權重總和：</span>
                                <span
                                    style={{
                                        color: Math.abs(
                                            editQuoteItems.reduce((sum, item) => sum + (item.quoteItemWeight ?? getWeight(item.quoteItemPrice)), 0) - 1
                                        ) > 0.001 ? "red" : undefined
                                    }}
                                >
                                    {editQuoteItems.reduce((sum, item) => sum + (item.quoteItemWeight ?? getWeight(item.quoteItemPrice)), 0).toFixed(2)}
                                </span>
                            </span>
                            <span>
                                <span className="font-bold">項目總金額：</span> {editQuoteItems.reduce((sum, item) => sum + (item.quoteItemPrice || 0), 0)}
                            </span>
                        </div>
                        <button type="button" className="px-3 py-1 bg-blue-500 text-white rounded mt-2" onClick={addEditItem}>新增項目</button>
                    </div>
                    <div className="mt-6 flex gap-2">
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">儲存</button>
                        <button type="button" className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500" onClick={() => setEditing(false)}>取消</button>
                    </div>
                </form>
            ) : (
                <div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                            <span className="font-bold">估價單名稱：</span> {quoteName}
                        </div>
                        <div>
                            <span className="font-bold">估價金額：</span> {quotePrice}
                        </div>
                        <div>
                            <span className="font-bold">客戶名稱：</span> {clientName}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                            <span className="font-bold">聯絡人：</span> {clientContact}
                        </div>
                        <div>
                            <span className="font-bold">電話：</span> {clientPhone}
                        </div>
                        <div>
                            <span className="font-bold">Email：</span> {clientEmail}
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block font-medium mb-2">估價項目：</label>
                        <table className="w-full border text-sm mb-2">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-800">
                                    <th className="border px-2 py-1">項目名稱</th>
                                    <th className="border px-2 py-1">金額</th>
                                    <th className="border px-1 py-1">數量</th>
                                    <th className="border px-2 py-1 min-w-[90px]">權重</th>
                                    <th className="border px-2 py-1">單價</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quoteItems.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="border px-2 py-1">{item.quoteItemId}</td>
                                        <td className="border px-2 py-1">{item.quoteItemPrice}</td>
                                        <td className="border px-1 py-1">{item.quoteItemQuantity}</td>
                                        <td className="border px-2 py-1">{(item.quoteItemWeight ?? getWeight(item.quoteItemPrice)).toFixed(2)}</td>
                                        <td className="border px-2 py-1 text-center">{getUnitPrice(item)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {/* 權重總和與總金額同一行，貼齊表格右側 */}
                        <div className="mt-2 flex justify-end gap-4 text-sm">
                            <span>
                                <span className="font-bold">權重總和：</span>
                                <span
                                    style={{
                                        color: Math.abs(
                                            quoteItems.reduce((sum, item) => sum + (item.quoteItemWeight ?? getWeight(item.quoteItemPrice)), 0) - 1
                                        ) > 0.001 ? "red" : undefined
                                    }}
                                >
                                    {quoteItems.reduce((sum, item) => sum + (item.quoteItemWeight ?? getWeight(item.quoteItemPrice)), 0).toFixed(2)}
                                </span>
                            </span>
                            <span>
                                <span className="font-bold">項目總金額：</span> {quoteItems.reduce((sum, item) => sum + (item.quoteItemPrice || 0), 0)}
                            </span>
                        </div>
                    </div>
                    <div className="mt-6 flex gap-2">
                        <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => setEditing(true)}>編輯</button>
                        <button type="button" className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500" onClick={() => router.push("/owner/quotes")}>返回</button>
                    </div>
                </div>
            )}
        </main>
    );
}
