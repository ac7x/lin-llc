"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

// 項目型別
interface OrderItem {
    orderItemId: string;
    orderItemPrice: number;
    orderItemQuantity: number;
}

export default function OrderDetailPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params?.order as string;
    const [orderName, setOrderName] = useState("");
    const [orderPrice, setOrderPrice] = useState(0);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [clientName, setClientName] = useState("");
    const [clientContact, setClientContact] = useState("");
    const [clientPhone, setClientPhone] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editing, setEditing] = useState(false);
    const [editOrderName, setEditOrderName] = useState("");
    const [editOrderPrice, setEditOrderPrice] = useState(0);
    const [editOrderItems, setEditOrderItems] = useState<OrderItem[]>([]);
    const [editClientName, setEditClientName] = useState("");
    const [editClientContact, setEditClientContact] = useState("");
    const [editClientPhone, setEditClientPhone] = useState("");
    const [editClientEmail, setEditClientEmail] = useState("");

    useEffect(() => {
        if (!orderId) return;
        setLoading(true);
        getDoc(doc(db, "orders", orderId))
            .then(snap => {
                if (!snap.exists()) {
                    setError("找不到訂單");
                    setLoading(false);
                    return;
                }
                const data = snap.data();
                setOrderName(data.orderName || "");
                setOrderPrice(data.orderPrice || 0);
                setOrderItems(Array.isArray(data.orderItems) ? data.orderItems : []);
                setClientName(data.clientName || "");
                setClientContact(data.clientContact || "");
                setClientPhone(data.clientPhone || "");
                setClientEmail(data.clientEmail || "");
                // 編輯狀態初始化
                setEditOrderName(data.orderName || "");
                setEditOrderPrice(data.orderPrice || 0);
                setEditOrderItems(Array.isArray(data.orderItems) ? data.orderItems : []);
                setEditClientName(data.clientName || "");
                setEditClientContact(data.clientContact || "");
                setEditClientPhone(data.clientPhone || "");
                setEditClientEmail(data.clientEmail || "");
                setLoading(false);
            })
            .catch(err => {
                setError("讀取失敗: " + (err instanceof Error ? err.message : String(err)));
                setLoading(false);
            });
    }, [orderId]);

    // 計算訂單項目總數量
    const totalOrderItemQuantity = orderItems.reduce((sum, item) => sum + (item.orderItemQuantity || 0), 0);
    // 權重與百分比
    const getWeight = (q: number) => (totalOrderItemQuantity ? q / totalOrderItemQuantity : 0);
    const getPercent = (q: number) => (totalOrderItemQuantity ? ((q / totalOrderItemQuantity) * 100).toFixed(2) : "0.00");

    // 編輯用操作
    const handleEditItemChange = (idx: number, key: keyof OrderItem, value: string | number) => {
        setEditOrderItems(items => items.map((item, i) => i === idx ? { ...item, [key]: value } : item));
    };
    const addEditItem = () => setEditOrderItems([...editOrderItems, { orderItemId: "", orderItemPrice: 0, orderItemQuantity: 1 }]);
    const removeEditItem = (idx: number) => setEditOrderItems(items => items.filter((_, i) => i !== idx));

    // 儲存編輯
    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await import("firebase/firestore").then(({ updateDoc, doc }) =>
                updateDoc(doc(db, "orders", orderId), {
                    orderName: editOrderName,
                    orderPrice: editOrderPrice,
                    orderItems: editOrderItems.map((item, idx) => ({
                        ...item,
                        orderItemId: item.orderItemId || String(idx + 1),
                    })),
                    clientName: editClientName,
                    clientContact: editClientContact,
                    clientPhone: editClientPhone,
                    clientEmail: editClientEmail,
                    updatedAt: new Date(),
                })
            );
            setOrderName(editOrderName);
            setOrderPrice(editOrderPrice);
            setOrderItems(editOrderItems);
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
            <h1 className="text-2xl font-bold mb-4">訂單詳情</h1>
            {loading ? (
                <div className="text-gray-400">載入中...</div>
            ) : error ? (
                <div className="text-red-500">{error}</div>
            ) : editing ? (
                <form onSubmit={handleSaveEdit}>
                    {/* 客戶資訊 */}
                    <div className="mb-4">
                        <input
                            type="text"
                            className="border px-2 py-1 rounded w-80 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700"
                            value={editClientName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditClientName(e.target.value)}
                        />
                    </div>
                    <div className="mb-4">
                        <input
                            type="text"
                            className="border px-2 py-1 rounded w-80 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700"
                            value={editClientContact}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditClientContact(e.target.value)}
                        />
                    </div>
                    <div className="mb-4">
                        <input
                            type="text"
                            className="border px-2 py-1 rounded w-80 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700"
                            value={editClientPhone}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditClientPhone(e.target.value)}
                        />
                    </div>
                    <div className="mb-4">
                        <input
                            type="email"
                            className="border px-2 py-1 rounded w-80 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700"
                            value={editClientEmail}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditClientEmail(e.target.value)}
                        />
                    </div>

                    {/* 訂單基本資訊 */}
                    <div className="mb-4">
                        <input
                            type="text"
                            className="border px-2 py-1 rounded w-80 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700"
                            value={editOrderName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditOrderName(e.target.value)}
                        />
                    </div>
                    <div className="mb-4">
                        <input
                            type="number"
                            className="border px-2 py-1 rounded w-40 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700"
                            value={editOrderPrice}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditOrderPrice(Number(e.target.value))}
                        />
                    </div>

                    {/* 訂單項目 */}
                    <div className="mb-4">
                        <table className="w-full border text-sm mb-2 border-gray-300 dark:border-gray-700">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-800">
                                    <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">項目ID</th>
                                    <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">項目金額</th>
                                    <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">項目數量</th>
                                    <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">項目單價</th>
                                    <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">權重</th>
                                    <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {editOrderItems.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center text-gray-400">無項目</td></tr>
                                ) : [...editOrderItems]
                                    .sort((a, b) => {
                                        const aNum = Number(a.orderItemId);
                                        const bNum = Number(b.orderItemId);
                                        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                                        return String(a.orderItemId).localeCompare(String(b.orderItemId));
                                    })
                                    .map((item, idx) => (
                                        <tr key={item.orderItemId + idx}>
                                            <td className="border px-2 py-1 border-gray-300 dark:border-gray-700">
                                                <input
                                                    type="text"
                                                    className="border px-2 py-1 rounded w-32 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700"
                                                    value={item.orderItemId}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEditItemChange(idx, "orderItemId", e.target.value)}
                                                    required
                                                />
                                            </td>
                                            <td className="border px-2 py-1 border-gray-300 dark:border-gray-700 text-right">
                                                <input
                                                    type="number"
                                                    className="border px-2 py-1 rounded w-24 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700 text-right"
                                                    min={0}
                                                    value={item.orderItemPrice}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEditItemChange(idx, "orderItemPrice", Number(e.target.value))}
                                                    required
                                                />
                                            </td>
                                            <td className="border px-2 py-1 border-gray-300 dark:border-gray-700">
                                                <input
                                                    type="number"
                                                    className="border px-2 py-1 rounded w-20 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700"
                                                    min={0}
                                                    value={item.orderItemQuantity}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEditItemChange(idx, "orderItemQuantity", Number(e.target.value))}
                                                    required
                                                />
                                            </td>
                                            <td className="border px-2 py-1 text-center border-gray-300 dark:border-gray-700">
                                                {item.orderItemQuantity ? (item.orderItemPrice / item.orderItemQuantity).toFixed(2) : "0.00"}
                                            </td>
                                            <td className="border px-2 py-1 text-center border-gray-300 dark:border-gray-700">
                                                {totalOrderItemQuantity ? (item.orderItemQuantity / totalOrderItemQuantity).toFixed(2) : "0.00"}
                                            </td>
                                            <td className="border px-2 py-1 text-center border-gray-300 dark:border-gray-700">
                                                {editOrderItems.length > 1 && (
                                                    <button type="button" className="text-red-500 dark:text-red-400" onClick={() => removeEditItem(idx)}>刪除</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                        <button type="button" className="bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-100 px-3 py-1 rounded mt-2" onClick={addEditItem}>新增項目</button>
                    </div>
                    <div className="mt-6 flex gap-2">
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">儲存</button>
                    </div>
                </form>
            ) : (
                <form>
                    {/* 客戶欄位 */}
                    <div className="mb-4">
                        <label className="block font-medium mb-1">客戶名稱：</label>
                        <input
                            type="text"
                            className="border px-2 py-1 rounded w-80 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700"
                            value={clientName}
                            readOnly
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block font-medium mb-1">客戶聯絡人：</label>
                        <input
                            type="text"
                            className="border px-2 py-1 rounded w-80 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700"
                            value={clientContact}
                            readOnly
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block font-medium mb-1">聯絡電話：</label>
                        <input
                            type="text"
                            className="border px-2 py-1 rounded w-80 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700"
                            value={clientPhone}
                            readOnly
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block font-medium mb-1">郵箱：</label>
                        <input
                            type="email"
                            className="border px-2 py-1 rounded w-80 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700"
                            value={clientEmail}
                            readOnly
                        />
                    </div>
                    {/* 訂單金額與項目移到下方 */}
                    <div className="mb-4">
                        <label className="block font-medium mb-1">訂單金額：</label>
                        <input
                            type="number"
                            className="border px-2 py-1 rounded w-40 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700"
                            value={orderPrice}
                            readOnly
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block font-medium mb-1">訂單項目：</label>
                        <table className="w-full border text-sm mb-2 border-gray-300 dark:border-gray-700">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-800">
                                    <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">項目ID</th>
                                    <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">項目金額</th>
                                    <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">項目數量</th>
                                    <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">項目單價</th>
                                    <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">權重</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orderItems.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center text-gray-400">無項目</td></tr>
                                ) : [...orderItems]
                                    .sort((a, b) => {
                                        const aNum = Number(a.orderItemId);
                                        const bNum = Number(b.orderItemId);
                                        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                                        return String(a.orderItemId).localeCompare(String(b.orderItemId));
                                    })
                                    .map((item, idx) => (
                                        <tr key={item.orderItemId + idx}>
                                            <td className="border px-2 py-1 border-gray-300 dark:border-gray-700">{item.orderItemId}</td>
                                            <td className="border px-2 py-1 border-gray-300 dark:border-gray-700 text-right">{item.orderItemPrice}</td>
                                            <td className="border px-2 py-1 border-gray-300 dark:border-gray-700">{item.orderItemQuantity}</td>
                                            <td className="border px-2 py-1 text-center border-gray-300 dark:border-gray-700">{item.orderItemQuantity ? (item.orderItemPrice / item.orderItemQuantity).toFixed(2) : "0.00"}</td>
                                            <td className="border px-2 py-1 text-center border-gray-300 dark:border-gray-700">{totalOrderItemQuantity ? (item.orderItemQuantity / totalOrderItemQuantity).toFixed(2) : "0.00"}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-6 flex gap-2">
                        <button type="button" className="bg-blue-600 dark:bg-green-900 text-white dark:text-green-400 px-6 py-2 rounded" onClick={() => router.push("/owner/orders")}>返回列表</button>
                        <button type="button" className="bg-yellow-500 dark:bg-yellow-800 text-white dark:text-yellow-200 px-6 py-2 rounded" onClick={() => setEditing(true)}>編輯</button>
                    </div>
                </form>
            )}
        </main>
    );
}
