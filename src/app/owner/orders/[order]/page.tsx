"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 項目型別
interface OrderItem {
    name: string;
    quantity: number;
}

export default function OrderDetailPage() {
    const router = useRouter();
    const [price, setPrice] = useState(0);
    const [items, setItems] = useState<OrderItem[]>([
        { name: "", quantity: 1 },
    ]);

    // 計算總數量
    const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

    // 權重與百分比
    const getWeight = (q: number) => (totalQuantity ? q / totalQuantity : 0);
    const getPercent = (q: number) => (totalQuantity ? ((q / totalQuantity) * 100).toFixed(2) : "0.00");

    // 項目操作
    const handleItemChange = (idx: number, key: keyof OrderItem, value: string | number) => {
        setItems(items => items.map((item, i) => i === idx ? { ...item, [key]: value } : item));
    };
    const addItem = () => setItems([...items, { name: "", quantity: 1 }]);
    const removeItem = (idx: number) => setItems(items => items.filter((_, i) => i !== idx));

    return (
        <main className="max-w-xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">訂單詳情</h1>
            <div className="mb-4">
                <label className="block font-medium mb-1">訂單價格：</label>
                <input
                    type="number"
                    className="border px-2 py-1 rounded w-40"
                    value={price}
                    min={0}
                    onChange={e => setPrice(Number(e.target.value))}
                />
            </div>
            <div className="mb-4">
                <label className="block font-medium mb-1">訂單項目：</label>
                <table className="w-full border text-sm mb-2">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border px-2 py-1">名稱</th>
                            <th className="border px-2 py-1">數量</th>
                            <th className="border px-2 py-1">權重</th>
                            <th className="border px-2 py-1">百分比</th>
                            <th className="border px-2 py-1">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="border px-2 py-1">
                                    <input
                                        type="text"
                                        className="border px-2 py-1 rounded w-32"
                                        value={item.name}
                                        onChange={e => handleItemChange(idx, "name", e.target.value)}
                                    />
                                </td>
                                <td className="border px-2 py-1">
                                    <input
                                        type="number"
                                        className="border px-2 py-1 rounded w-20"
                                        min={0}
                                        value={item.quantity}
                                        onChange={e => handleItemChange(idx, "quantity", Number(e.target.value))}
                                    />
                                </td>
                                <td className="border px-2 py-1 text-center">{getWeight(item.quantity).toFixed(2)}</td>
                                <td className="border px-2 py-1 text-center">{getPercent(item.quantity)}%</td>
                                <td className="border px-2 py-1 text-center">
                                    {items.length > 1 && (
                                        <button className="text-red-500" onClick={() => removeItem(idx)}>刪除</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button className="bg-gray-200 px-3 py-1 rounded" onClick={addItem}>新增項目</button>
            </div>
            <div className="mt-6">
                <button className="bg-blue-600 text-white px-6 py-2 rounded" onClick={() => router.push("/owner/orders")}>返回列表</button>
            </div>
        </main>
    );
}
