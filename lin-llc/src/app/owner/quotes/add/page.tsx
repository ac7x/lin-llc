"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { doc, setDoc } from "firebase/firestore";
import { nanoid } from "nanoid";

interface QuoteItem {
    quoteItemId: string;
    quoteItemDescription: string;
    quoteItemPrice: number;
    quoteItemQuantity: number;
}

export default function QuoteAddPage() {
    const router = useRouter();
    const [clientName, setClientName] = useState("");
    const [clientContact, setClientContact] = useState("");
    const [clientPhone, setClientPhone] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([
        { quoteItemId: "", quoteItemDescription: "", quoteItemPrice: 0, quoteItemQuantity: 1 },
    ]);

    const totalQuoteItemPrice = quoteItems.reduce((sum, item) => sum + (item.quoteItemPrice || 0), 0);

    const handleItemChange = (idx: number, key: keyof QuoteItem, value: string | number) => {
        setQuoteItems(items => items.map((item, i) => i === idx ? { ...item, [key]: value } : item));
    };

    const addItem = () => setQuoteItems([...quoteItems, { quoteItemId: "", quoteItemDescription: "", quoteItemPrice: 0, quoteItemQuantity: 1 }]);
    const removeItem = (idx: number) => setQuoteItems(items => items.filter((_, i) => i !== idx));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const quoteId = nanoid(5);
            const now = new Date();
            await setDoc(doc(db, "quotes", quoteId), {
                quoteId,
                clientName,
                clientContact,
                clientPhone,
                clientEmail,
                quoteItems: quoteItems.map((item, idx) => ({
                    ...item,
                    quoteItemId: item.quoteItemId || String(idx + 1),
                })),
                totalQuoteItemPrice,
                createdAt: now,
                updatedAt: now,
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
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="客戶名稱"
                        className="border px-2 py-1 rounded w-full"
                        value={clientName}
                        onChange={e => setClientName(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="聯絡人"
                        className="border px-2 py-1 rounded w-full"
                        value={clientContact}
                        onChange={e => setClientContact(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="電話"
                        className="border px-2 py-1 rounded w-full"
                        value={clientPhone}
                        onChange={e => setClientPhone(e.target.value)}
                        required
                    />
                    <input
                        type="email"
                        placeholder="電子郵件"
                        className="border px-2 py-1 rounded w-full"
                        value={clientEmail}
                        onChange={e => setClientEmail(e.target.value)}
                        required
                    />
                </div>
                <h2 className="text-lg font-bold mb-2">估價項目</h2>
                {quoteItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-4 mb-4">
                        <input
                            type="text"
                            placeholder="項目描述"
                            className="border px-2 py-1 rounded w-full"
                            value={item.quoteItemDescription}
                            onChange={e => handleItemChange(idx, "quoteItemDescription", e.target.value)}
                            required
                        />
                        <input
                            type="number"
                            placeholder="單價"
                            className="border px-2 py-1 rounded w-full"
                            value={item.quoteItemPrice}
                            onChange={e => handleItemChange(idx, "quoteItemPrice", Number(e.target.value))}
                            required
                        />
                        <input
                            type="number"
                            placeholder="數量"
                            className="border px-2 py-1 rounded w-full"
                            value={item.quoteItemQuantity}
                            onChange={e => handleItemChange(idx, "quoteItemQuantity", Number(e.target.value))}
                            required
                        />
                        <button type="button" onClick={() => removeItem(idx)} className="text-red-500">刪除</button>
                    </div>
                ))}
                <button type="button" onClick={addItem} className="mb-4 text-blue-500">新增項目</button>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">送出</button>
            </form>
        </main>
    );
}