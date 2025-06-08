"use client";

import { useParams } from "next/navigation";
import { useState, useMemo } from "react";
import { db, doc } from "@/lib/firebase-client";
import { updateDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { useDocument } from "react-firebase-hooks/firestore";
import { Project } from "@/types/project";
import { MaterialEntry } from "@/types/project";

export default function ProjectMaterialsPage() {
    const params = useParams();
    const projectId = params?.project as string;
    const [projectDoc, loading, error] = useDocument(
        doc(db, "projects", projectId)
    );

    const [newMaterial, setNewMaterial] = useState<{
        name: string;
        quantity: number;
        unit: string;
        supplier: string;
        notes: string;
    }>({
        name: "",
        quantity: 0,
        unit: "個",
        supplier: "",
        notes: ""
    });

    const [saving, setSaving] = useState(false);

    // 從 Firestore 獲取材料數據
    const materials = useMemo(() => {
        if (!projectDoc?.exists()) return [];
        const project = projectDoc.data() as Project;
        return project.materials || [];
    }, [projectDoc]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (saving || !newMaterial.name) return;

        setSaving(true);
        try {
            const materialEntry: MaterialEntry = {
                materialId: Timestamp.now().toMillis().toString(),
                name: newMaterial.name,
                quantity: newMaterial.quantity,
                unit: newMaterial.unit,
                supplier: newMaterial.supplier,
                notes: newMaterial.notes
            };

            // 如果專案尚未有材料陣列，初始化一個
            if (!projectDoc?.data()?.materials) {
                await updateDoc(doc(db, "projects", projectId), {
                    materials: [materialEntry]
                });
            } else {
                // 添加新材料到陣列
                await updateDoc(doc(db, "projects", projectId), {
                    materials: arrayUnion(materialEntry)
                });
            }

            setNewMaterial({
                name: "",
                quantity: 0,
                unit: "個",
                supplier: "",
                notes: ""
            });

            alert("材料記錄已成功添加！");
        } catch (error) {
            console.error("無法保存材料記錄：", error);
            alert("保存材料記錄時出錯：" + error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4">載入中...</div>;
    if (error) return <div className="p-4 text-red-500">錯誤: {error.message}</div>;
    if (!projectDoc?.exists()) return <div className="p-4">找不到專案</div>;

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">專案材料記錄</h1>
            </div>

            {/* 添加新材料表單 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">記錄新材料</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">材料名稱<span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                className="border rounded w-full px-3 py-2"
                                value={newMaterial.name}
                                onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">供應商</label>
                            <input
                                type="text"
                                className="border rounded w-full px-3 py-2"
                                value={newMaterial.supplier}
                                onChange={(e) => setNewMaterial({ ...newMaterial, supplier: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium mb-1">數量</label>
                            <input
                                type="number"
                                className="border rounded w-full px-3 py-2"
                                value={newMaterial.quantity}
                                onChange={(e) => setNewMaterial({ ...newMaterial, quantity: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium mb-1">單位</label>
                            <select
                                className="border rounded w-full px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                value={newMaterial.unit}
                                onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                            >
                                <option value="個">個</option>
                                <option value="箱">箱</option>
                                <option value="公斤">公斤</option>
                                <option value="公噸">公噸</option>
                                <option value="立方米">立方米</option>
                                <option value="平方米">平方米</option>
                                <option value="公尺">公尺</option>
                                <option value="件">件</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">備註</label>
                        <textarea
                            className="border rounded w-full px-3 py-2 h-24"
                            value={newMaterial.notes}
                            onChange={(e) => setNewMaterial({ ...newMaterial, notes: e.target.value })}
                            placeholder="材料的其他說明、特性、用途等"
                        />
                    </div>

                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                        disabled={saving || !newMaterial.name}
                    >
                        {saving ? "保存中..." : "記錄材料"}
                    </button>
                </form>
            </div>

            {/* 材料列表 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <h2 className="text-xl font-bold p-6 border-b">材料記錄列表</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">材料名稱</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">數量</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">供應商</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">備註</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {materials && materials.length > 0 ? (
                                materials.map((material) => (
                                    <tr key={material.materialId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-6 py-4 whitespace-nowrap">{material.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {material.quantity} {material.unit}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{material.supplier || "-"}</td>
                                        <td className="px-6 py-4">{material.notes || "-"}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">暫無材料記錄</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
