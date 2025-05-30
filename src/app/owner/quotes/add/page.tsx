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
    quoteItemWeight?: number; // 權重 (0~1)
}

export default function QuoteAddPage() {
    const router = useRouter();
    const [clientName, setClientName] = useState("");
    const [clientContact, setClientContact] = useState("");
    const [clientPhone, setClientPhone] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const [autoSum, setAutoSum] = useState(false); // 是否自動加總
    const [quotePrice, setQuotePrice] = useState(0);
    const [quoteName, setQuoteName] = useState("");
    const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([
        { quoteItemId: "", quoteItemPrice: 0, quoteItemQuantity: 1, quoteItemWeight: 0 },
    ]);

    // 項目總價
    const totalQuoteItemPrice = quoteItems.reduce((sum, item) => sum + (item.quoteItemPrice || 0), 0);

    // quotePrice 實際顯示值
    const displayQuotePrice = autoSum ? totalQuoteItemPrice : quotePrice;

    // 權重與百分比（以金額為基礎）
    const getWeight = (price: number) => (quotePrice ? price / quotePrice : 0);
    const getPercent = (price: number) => (quotePrice ? ((price / quotePrice) * 100).toFixed(2) : "0.00");
    // 單價自動計算
    const getUnitPrice = (item: QuoteItem) => (item.quoteItemQuantity ? (item.quoteItemPrice / item.quoteItemQuantity).toFixed(2) : "0.00");

    // 欄位變動時自動計算
    const handleItemChange = (idx: number, key: keyof QuoteItem, value: string | number) => {
        setQuoteItems(items => items.map((item, i) => {
            if (i !== idx) return item;
            let newItem = { ...item, [key]: value };
            // 權重變動時自動算金額
            if (key === "quoteItemWeight" && typeof value === "number" && quotePrice > 0) {
                newItem.quoteItemPrice = Number((value as number) * quotePrice);
            }
            // 金額變動時自動算權重
            if (key === "quoteItemPrice" && typeof value === "number" && quotePrice > 0) {
                newItem.quoteItemWeight = Number((value as number) / quotePrice);
            }
            // 數量變動時自動算單價
            if (key === "quoteItemQuantity" && typeof value === "number" && value > 0) {
                // 若有單價欄位可自動算，這裡暫不處理
            }
            return newItem;
        }));
    };
    const addItem = () => setQuoteItems([...quoteItems, { quoteItemId: "", quoteItemPrice: 0, quoteItemQuantity: 1, quoteItemWeight: 0 }]);
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
                quotePrice: autoSum ? totalQuoteItemPrice : quotePrice,
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
                        <div className="flex gap-2 items-center">
                            <input
                                type="checkbox"
                                id="autoSum"
                                checked={autoSum}
                                onChange={e => setAutoSum(e.target.checked)}
                                className="mr-1"
                            />
                            <label htmlFor="autoSum" className="text-sm select-none cursor-pointer">由項目自動加總</label>
                        </div>
                        <input
                            type="number"
                            className="border px-2 py-1 rounded w-full mt-1 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-blue-400 focus:ring-2 focus:ring-blue-200"
                            value={displayQuotePrice}
                            min={0}
                            onChange={e => setQuotePrice(Number(e.target.value))}
                            required
                            readOnly={autoSum}
                            tabIndex={autoSum ? -1 : 0}
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
                                <th className="border px-2 py-1">權重</th>
                                <th className="border px-2 py-1">單價</th>
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
                                    <td className="border px-2 py-1">
                                        <input
                                            type="number"
                                            className="border px-2 py-1 rounded w-full"
                                            value={item.quoteItemWeight ?? 0}
                                            min={0}
                                            max={1}
                                            step={0.01}
                                            onChange={e => handleItemChange(idx, "quoteItemWeight", Number(e.target.value))}
                                        />
                                    </td>
                                    <td className="border px-2 py-1 text-center">{getUnitPrice(item)}</td>
                                    <td className="border px-2 py-1 text-center">
                                        <button type="button" className="text-red-500" onClick={() => removeItem(idx)} disabled={quoteItems.length === 1}>刪除</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button type="button" className="px-3 py-1 bg-blue-500 text-white rounded" onClick={addItem}>新增項目</button>
                    {/* 權重總和顯示 */}
                    <div className="mt-2 text-right">
                        <span className="font-bold">權重總和：</span>
                        <span
                            style={{
                                color: Math.abs(
                                    quoteItems.reduce((sum, item) => sum + (item.quoteItemWeight ?? 0), 0) - 1
                                ) > 0.001 ? "red" : undefined
                            }}
                        >
                            {quoteItems.reduce((sum, item) => sum + (item.quoteItemWeight ?? 0), 0).toFixed(2)}
                        </span>
                    </div>
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
