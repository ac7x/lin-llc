"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection } from "firebase/firestore";
import { nanoid } from "nanoid";

import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

// 項目型別
interface OrderItem {
    name: string;
    price: number; // 項目價格
    quantity: number;
}

export default function OrderAddPage() {
    const router = useRouter();
    const [price, setPrice] = useState(0);
    const [name, setName] = useState("");
    const [items, setItems] = useState<OrderItem[]>([
        { name: "", price: 0, quantity: 1 },
    ]);

    // 計算總數量
    const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    // 項目總價
    const totalItemPrice = items.reduce((sum, item) => sum + (item.price || 0), 0);

    // 權重與百分比
    const getWeight = (q: number) => (totalQuantity ? q / totalQuantity : 0);
    const getPercent = (q: number) => (totalQuantity ? ((q / totalQuantity) * 100).toFixed(2) : "0.00");
    // 單價自動計算
    const getUnitPrice = (item: OrderItem) => (item.quantity ? (item.price / item.quantity).toFixed(2) : "0.00");

    // 項目操作
    const handleItemChange = (idx: number, key: keyof OrderItem, value: string | number) => {
        setItems(items => items.map((item, i) => i === idx ? { ...item, [key]: value } : item));
    };
    const addItem = () => setItems([...items, { name: "", price: 0, quantity: 1 }]);
    const removeItem = (idx: number) => setItems(items => items.filter((_, i) => i !== idx));

    // 處理送出
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // 產生5位數、僅0-9a-z的nanoid序號
            const orderId = nanoid(5);
            await addDoc(collection(db, "orders"), {
                id: orderId,
                name,
                price,
                items,
                totalItemPrice,
                createdAt: new Date(),
            });
            router.push("/owner/orders");
        } catch (err) {
            alert("新增訂單失敗: " + (err instanceof Error ? err.message : String(err)));
        }
    };

    return (
        <main className="max-w-xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">新增訂單</h1>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block font-medium mb-1">訂單名稱：</label>
                    <input
                        type="text"
                        className="border px-2 py-1 rounded w-80 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block font-medium mb-1">訂單價格：</label>
                    <input
                        type="number"
                        className="border px-2 py-1 rounded w-40 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700"
                        value={price}
                        min={0}
                        onChange={e => setPrice(Number(e.target.value))}
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block font-medium mb-1">訂單項目：</label>
                    <table className="w-full border text-sm mb-2 border-gray-300 dark:border-gray-700">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-gray-800">
                                <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">項目名稱</th>
                                <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">項目計價</th>
                                <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">項目數量</th>
                                <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">項目單價</th>
                                <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">項目權重</th>
                                <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">項目佔比</th>
                                <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">項目加總</th>
                                <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="border px-2 py-1 border-gray-300 dark:border-gray-700">
                                        <input
                                            type="text"
                                            className="border px-2 py-1 rounded w-32 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700"
                                            value={item.name}
                                            onChange={e => handleItemChange(idx, "name", e.target.value)}
                                            required
                                        />
                                    </td>
                                    <td className="border px-2 py-1 border-gray-300 dark:border-gray-700 text-right">
                                        <input
                                            type="number"
                                            className="border px-2 py-1 rounded w-24 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700 text-right"
                                            min={0}
                                            value={item.price}
                                            onChange={e => handleItemChange(idx, "price", Number(e.target.value))}
                                            required
                                        />
                                    </td>
                                    <td className="border px-2 py-1 border-gray-300 dark:border-gray-700">
                                        <input
                                            type="number"
                                            className="border px-2 py-1 rounded w-20 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700"
                                            min={0}
                                            value={item.quantity}
                                            onChange={e => handleItemChange(idx, "quantity", Number(e.target.value))}
                                            required
                                        />
                                    </td>
                                    <td className="border px-2 py-1 border-gray-300 dark:border-gray-700">
                                        <input
                                            type="number"
                                            className="border px-2 py-1 rounded w-20 bg-gray-100 dark:bg-gray-700 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700"
                                            value={getUnitPrice(item)}
                                            disabled
                                        />
                                    </td>
                                    <td className="border px-2 py-1 text-center border-gray-300 dark:border-gray-700">{getWeight(item.quantity).toFixed(2)}</td>
                                    <td className="border px-2 py-1 text-center border-gray-300 dark:border-gray-700">{getPercent(item.quantity)}%</td>
                                    <td className="border px-2 py-1 text-right border-gray-300 dark:border-gray-700">
                                        {item.price}
                                    </td>
                                    <td className="border px-2 py-1 text-center border-gray-300 dark:border-gray-700">
                                        {items.length > 1 && (
                                            <button type="button" className="text-red-500 dark:text-red-400" onClick={() => removeItem(idx)}>刪除</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex justify-end text-sm text-gray-700 dark:text-gray-200 mt-2">
                        <span>項目總價：<span className="font-bold">{totalItemPrice}</span></span>
                        <span className="ml-6">訂單價格：<span className="font-bold">{price}</span></span>
                    </div>
                    <button type="button" className="bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-100 px-3 py-1 rounded mt-2" onClick={addItem}>新增項目</button>
                </div>
                <div className="mt-6 flex gap-2">
                    <button type="submit" className="bg-blue-600 dark:bg-green-900 text-white dark:text-green-400 px-6 py-2 rounded">送出訂單</button>
                    <button type="button" className="bg-gray-300 dark:bg-gray-800 text-black dark:text-gray-100 px-6 py-2 rounded" onClick={() => router.push("/owner/orders")}>返回列表</button>
                </div>
            </form>
        </main>
    );
}
