"use client";

import { useParams, useRouter } from "next/navigation";
import { useDocument } from "react-firebase-hooks/firestore";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { Project } from "@/types/project";
import { Workpackage, SubWorkpackage } from "@/types/workpackage";
import { useState } from "react";

export default function WorkpackageDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params?.project as string;
    const workpackageId = params?.workpackage as string;
    const [projectDoc, loading, error] = useDocument(doc(db, "projects", projectId));
    const [tab, setTab] = useState<"info" | "edit" | "subworkpackages">("info");
    const [saving, setSaving] = useState(false);
    const [newSubWorkpackage, setNewSubWorkpackage] = useState({
        name: "",
        description: "",
    });
    const [subSaving, setSubSaving] = useState(false);

    if (loading) return <div>載入中...</div>;
    if (error) return <div>錯誤: {error.message}</div>;
    if (!projectDoc?.exists()) return <div>找不到專案</div>;

    const project = projectDoc.data() as Project;
    const workpackage = project.workpackages?.find(wp => wp.id === workpackageId);

    if (!workpackage) return <div>找不到此工作包</div>;

    const handleSave = async (updates: Partial<Workpackage>) => {
        setSaving(true);
        try {
            const updatedWorkpackages = project.workpackages.map(wp =>
                wp.id === workpackageId ? { ...wp, ...updates } : wp
            );

            await updateDoc(doc(db, "projects", projectId), {
                workpackages: updatedWorkpackages,
            });

            router.refresh();
        } catch (err) {
            console.error("更新失敗:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleAddSubWorkpackage = async () => {
        if (!newSubWorkpackage.name.trim() || subSaving) return;
        setSubSaving(true);

        try {
            // 建立新的子工作包
            const newSubWp: SubWorkpackage = {
                id: Date.now().toString(),
                name: newSubWorkpackage.name.trim(),
                description: newSubWorkpackage.description,
                status: "新建立",
                progress: 0,
                createdAt: new Date().toISOString(),
                tasks: [],
            };

            // 更新工作包，添加子工作包
            const updatedWorkpackages = project.workpackages.map(wp =>
                wp.id === workpackageId
                    ? { ...wp, subWorkpackages: [...(wp.subWorkpackages || []), newSubWp] }
                    : wp
            );

            await updateDoc(doc(db, "projects", projectId), {
                workpackages: updatedWorkpackages,
            });

            setNewSubWorkpackage({ name: "", description: "" });
        } catch (err) {
            console.error("建立子工作包失敗:", err);
        } finally {
            setSubSaving(false);
        }
    };

    return (
        <main className="max-w-4xl mx-auto p-4">
            {/* Tabs */}
            <div className="mb-6 border-b flex space-x-4">
                <button
                    className={`px-4 py-2 -mb-px border-b-2 ${tab === "info" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-gray-600"}`}
                    onClick={() => setTab("info")}
                >
                    基本資訊
                </button>
                <button
                    className={`px-4 py-2 -mb-px border-b-2 ${tab === "edit" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-gray-600"}`}
                    onClick={() => setTab("edit")}
                >
                    編輯資訊
                </button>
                <button
                    className={`px-4 py-2 -mb-px border-b-2 ${tab === "subworkpackages" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-gray-600"}`}
                    onClick={() => setTab("subworkpackages")}
                >
                    子工作包
                </button>
            </div>

            {tab === "info" && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-6">
                        <h1 className="text-2xl font-bold">{workpackage.name}</h1>
                        <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {workpackage.status || "新建立"}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-gray-500">描述</label>
                            <div>{workpackage.description || '-'}</div>
                        </div>
                        <div>
                            <label className="text-gray-500">類別</label>
                            <div>{workpackage.category || '-'}</div>
                        </div>
                        <div>
                            <label className="text-gray-500">優先級</label>
                            <div>
                                {workpackage.priority === 'high' && '高'}
                                {workpackage.priority === 'medium' && '中'}
                                {workpackage.priority === 'low' && '低'}
                                {!workpackage.priority && '-'}
                            </div>
                        </div>
                        <div>
                            <label className="text-gray-500">負責人</label>
                            <div>{workpackage.assignedTo || '-'}</div>
                        </div>
                        <div>
                            <label className="text-gray-500">開始日期</label>
                            <div>{workpackage.startDate || '-'}</div>
                        </div>
                        <div>
                            <label className="text-gray-500">結束日期</label>
                            <div>{workpackage.endDate || '-'}</div>
                        </div>
                        <div>
                            <label className="text-gray-500">進度</label>
                            <div className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${workpackage.progress || 0}%` }}></div>
                                </div>
                                <span>{workpackage.progress || 0}%</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-gray-500">預算</label>
                            <div>{workpackage.budget ? `$${workpackage.budget.toLocaleString()}` : '-'}</div>
                        </div>
                        <div>
                            <label className="text-gray-500">子工作包數量</label>
                            <div>{workpackage.subWorkpackages?.length || 0}個</div>
                        </div>
                        <div>
                            <label className="text-gray-500">建立日期</label>
                            <div>{workpackage.createdAt ? new Date(workpackage.createdAt).toLocaleDateString() : '-'}</div>
                        </div>
                    </div>
                </div>
            )}

            {tab === "edit" && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4">編輯工作包資訊</h2>
                    <form className="space-y-4" onSubmit={e => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        handleSave({
                            name: formData.get("name") as string,
                            description: formData.get("description") as string,
                            startDate: formData.get("startDate") as string,
                            endDate: formData.get("endDate") as string,
                            status: formData.get("status") as string,
                            assignedTo: formData.get("assignedTo") as string,
                            progress: Number(formData.get("progress")),
                        });
                    }}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                工作包名稱
                            </label>
                            <input
                                type="text"
                                name="name"
                                defaultValue={workpackage.name}
                                className="w-full border rounded px-3 py-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                說明
                            </label>
                            <textarea
                                name="description"
                                defaultValue={workpackage.description}
                                className="w-full border rounded px-3 py-2 h-32"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    開始日期
                                </label>
                                <input
                                    type="date"
                                    name="startDate"
                                    defaultValue={workpackage.startDate}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    結束日期
                                </label>
                                <input
                                    type="date"
                                    name="endDate"
                                    defaultValue={workpackage.endDate}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    狀態
                                </label>
                                <select
                                    name="status"
                                    defaultValue={workpackage.status}
                                    className="w-full border rounded px-3 py-2"
                                >
                                    <option value="未開始">未開始</option>
                                    <option value="進行中">進行中</option>
                                    <option value="已完成">已完成</option>
                                    <option value="已暫停">已暫停</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    負責人
                                </label>
                                <input
                                    type="text"
                                    name="assignedTo"
                                    defaultValue={workpackage.assignedTo}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    進度 (%)
                                </label>
                                <input
                                    type="number"
                                    name="progress"
                                    min="0"
                                    max="100"
                                    defaultValue={workpackage.progress || 0}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-6">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? "儲存中..." : "儲存變更"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {tab === "subworkpackages" && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4">子工作包列表</h2>

                    {/* 新增子工作包表單 */}
                    <div className="mb-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">名稱</label>
                            <input
                                type="text"
                                className="border rounded px-3 py-2 w-full"
                                placeholder="輸入子工作包名稱"
                                value={newSubWorkpackage.name}
                                onChange={e => setNewSubWorkpackage(prev => ({ ...prev, name: e.target.value }))}
                                disabled={subSaving}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">描述</label>
                            <textarea
                                className="border rounded px-3 py-2 w-full"
                                placeholder="輸入子工作包描述"
                                value={newSubWorkpackage.description}
                                onChange={e => setNewSubWorkpackage(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                disabled={subSaving}
                            />
                        </div>
                        <div>
                            <button
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                onClick={handleAddSubWorkpackage}
                                disabled={subSaving || !newSubWorkpackage.name.trim()}
                            >
                                {subSaving ? "建立中..." : "新增子工作包"}
                            </button>
                        </div>
                    </div>

                    {/* 子工作包列表 */}
                    {workpackage.subWorkpackages && workpackage.subWorkpackages.length > 0 ? (
                        <div className="space-y-4">
                            {workpackage.subWorkpackages.map((subWp) => (
                                <div key={subWp.id} className="border rounded p-4">
                                    <h3 className="font-bold">{subWp.name}</h3>
                                    {subWp.description && (
                                        <p className="text-gray-600 mt-1">{subWp.description}</p>
                                    )}
                                    <div className="mt-2 text-sm text-gray-500">
                                        狀態: {subWp.status || '新建立'} | 進度: {subWp.progress ?? 0}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                            目前沒有子工作包
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
