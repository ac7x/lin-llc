"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setDoc, doc } from "firebase/firestore";
import { nanoid } from "nanoid";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

// 項目型別
interface QuoteItem {
    quoteItemId: string;
    quoteItemPrice: number; // 項目金額
    quoteItemQuantity: number;
}

export default function QuoteAddPage() {
    const router = useRouter();
    const [clientName, setClientName] = useState("");
    const [clientContact, setClientContact] = useState("");
    const [clientPhone, setClientPhone] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const [quotePrice, setQuotePrice] = useState(0);
    const [quoteName, setQuoteName] = useState("");
    const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([
        { quoteItemId: "", quoteItemPrice: 0, quoteItemQuantity: 1 },
    ]);

    // 項目總價
    const totalQuoteItemPrice = quoteItems.reduce((sum, item) => sum + (item.quoteItemPrice || 0), 0);

    // 權重與百分比（以金額為基礎）
    const getWeight = (price: number) => (quotePrice ? price / quotePrice : 0);
    const getPercent = (price: number) => (quotePrice ? ((price / quotePrice) * 100).toFixed(2) : "0.00");
    // 單價自動計算
    const getUnitPrice = (item: QuoteItem) => (item.quoteItemQuantity ? (item.quoteItemPrice / item.quoteItemQuantity).toFixed(2) : "0.00");

    // 項目操作
    const handleItemChange = (idx: number, key: keyof QuoteItem, value: string | number) => {
        setQuoteItems(items => items.map((item, i) => i === idx ? { ...item, [key]: value } : item));
    };
    const addItem = () => setQuoteItems([...quoteItems, { quoteItemId: "", quoteItemPrice: 0, quoteItemQuantity: 1 }]);
    const removeItem = (idx: number) => setQuoteItems(items => items.filter((_, i) => i !== idx));

    // 處理送出
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const quoteId = nanoid(5);
            const now = new Date();
            await setDoc(doc(db, "quotes", quoteId), {
                quoteId,
                quoteName,
                quotePrice,
                quoteItems: quoteItems.map((item, idx) => ({
                    ...item,
                    quoteItemId: item.quoteItemId || String(idx + 1), // 若未填則用序號
                })),
                totalQuoteItemPrice,
                createdAt: now,
                updatedAt: now,
                clientName,
                clientContact,
                clientPhone,
                clientEmail,
            });
            router.push("/owner/quotes");
        } catch (err) {
            alert("新增估價單失敗: " + (err instanceof Error ? err.message : String(err)));
        }
    };

    return (
        <main className="max-w-xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">新增估價單</h1>
            <form onSubmit={handleSubmit}>
                {/* 估價單名稱、估價金額、客戶名稱同一行 */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block font-medium mb-1">估價單名稱：</label>
                        <input
                            type="text"
                            className="border px-2 py-1 rounded w-full bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-blue-400 focus:ring-2 focus:ring-blue-200"
                            value={quoteName}
                            onChange={e => setQuoteName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">估價金額：</label>
                        <input
                            type="number"
                            className="border px-2 py-1 rounded w-full bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-blue-400 focus:ring-2 focus:ring-blue-200"
                            value={quotePrice}
                            min={0}
                            onChange={e => setQuotePrice(Number(e.target.value))}
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">客戶名稱：</label>
                        <input
                            type="text"
                            className="border px-2 py-1 rounded w-full bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-blue-400 focus:ring-2 focus:ring-blue-200"
                            value={clientName}
                            onChange={e => setClientName(e.target.value)}
                        />
                    </div>
                </div>
                {/* 客戶聯絡資訊 */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block font-medium mb-1">聯絡人：</label>
                        <input
                            type="text"
                            className="border px-2 py-1 rounded w-full bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-blue-400 focus:ring-2 focus:ring-blue-200"
                            value={clientContact}
                            onChange={e => setClientContact(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">電話：</label>
                        <input
                            type="text"
                            className="border px-2 py-1 rounded w-full bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-blue-400 focus:ring-2 focus:ring-blue-200"
                            value={clientPhone}
                            onChange={e => setClientPhone(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Email：</label>
                        <input
                            type="email"
                            className="border px-2 py-1 rounded w-full bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-blue-400 focus:ring-2 focus:ring-blue-200"
                            value={clientEmail}
                            onChange={e => setClientEmail(e.target.value)}
                        />
                    </div>
                </div>
                {/* 估價項目列表 */}
                <div className="mb-4">
                    <label className="block font-medium mb-2">估價項目：</label>
                    <table className="w-full border text-sm mb-2">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-gray-800">
                                <th className="border px-2 py-1">項目名稱</th>
                                <th className="border px-2 py-1">金額</th>
                                <th className="border px-2 py-1">數量</th>
                                <th className="border px-2 py-1">單價</th>
                                <th className="border px-2 py-1">百分比</th>
                                <th className="border px-2 py-1">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quoteItems.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="border px-2 py-1">
                                        <input
                                            type="text"
                                            className="border px-2 py-1 rounded w-full"
                                            value={item.quoteItemId}
                                            onChange={e => handleItemChange(idx, "quoteItemId", e.target.value)}
                                            required
                                        />
                                    </td>
                                    <td className="border px-2 py-1">
                                        <input
                                            type="number"
                                            className="border px-2 py-1 rounded w-full"
                                            value={item.quoteItemPrice}
                                            min={0}
                                            onChange={e => handleItemChange(idx, "quoteItemPrice", Number(e.target.value))}
                                            required
                                        />
                                    </td>
                                    <td className="border px-2 py-1">
                                        <input
                                            type="number"
                                            className="border px-2 py-1 rounded w-full"
                                            value={item.quoteItemQuantity}
                                            min={1}
                                            onChange={e => handleItemChange(idx, "quoteItemQuantity", Number(e.target.value))}
                                            required
                                        />
                                    </td>
                                    <td className="border px-2 py-1 text-center">{getUnitPrice(item)}</td>
                                    <td className="border px-2 py-1 text-center">{getPercent(item.quoteItemPrice)}%</td>
                                    <td className="border px-2 py-1 text-center">
                                        <button type="button" className="text-red-500" onClick={() => removeItem(idx)} disabled={quoteItems.length === 1}>刪除</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button type="button" className="px-3 py-1 bg-blue-500 text-white rounded" onClick={addItem}>新增項目</button>
                </div>
                {/* 總金額顯示 */}
                <div className="mb-4 text-right">
                    <span className="font-bold">項目總金額：</span> {totalQuoteItemPrice}
                </div>
                <div className="mt-6 flex gap-2">
                    <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">送出</button>
                    <button type="button" className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500" onClick={() => router.push("/owner/quotes")}>取消</button>
                </div>
            </form>
        </main>
    );
}
