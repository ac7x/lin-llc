"use client";

import { useParams, useRouter } from "next/navigation";
import { useDocument } from "react-firebase-hooks/firestore";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { useState } from "react";

interface Workpackage {
    id: string;
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    progress?: number;
    assignedTo?: string;
    childrenIds: string[];
    createdAt?: string;
}

export default function WorkpackageDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params?.project as string;
    const workpackageId = params?.workpackage as string;
    const [projectDoc, loading, error] = useDocument(doc(db, "projects", projectId));
    const [tab, setTab] = useState<"info" | "edit" | "subworkpackages">("info");
    const [saving, setSaving] = useState(false);
    const [newSubWpName, setNewSubWpName] = useState("");
    const [subSaving, setSubSaving] = useState(false);

    if (loading) return <div>載入中...</div>;
    if (error) return <div>錯誤: {error.message}</div>;
    if (!projectDoc?.exists()) return <div>找不到專案</div>;

    const project = projectDoc.data();
    const workpackage = project?.workpackages?.find((wp: { id: string }) => wp.id === workpackageId);

    if (!workpackage) return <div>找不到此工作包</div>;

    const handleSave = async (updates: Partial<Workpackage>) => {
        setSaving(true);
        try {
            const updatedWorkpackages = project.workpackages.map((wp: Workpackage) =>
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
        if (!newSubWpName.trim() || subSaving) return;
        setSubSaving(true);
        try {
            const newId = Date.now().toString();
            // 建立新的子工作包
            const newSubWp = {
                id: newId,
                name: newSubWpName.trim(),
                childrenIds: [],
                status: "新建立",
                createdAt: new Date().toISOString(),
            };
            // 更新父工作包的 childrenIds
            const updatedWorkpackages = project.workpackages.map((wp: Workpackage) =>
                wp.id === workpackageId
                    ? { ...wp, childrenIds: [...wp.childrenIds, newId] }
                    : wp
            );
            // 加入新的子工作包
            updatedWorkpackages.push(newSubWp);

            await updateDoc(doc(db, "projects", projectId), {
                workpackages: updatedWorkpackages,
            });
            setNewSubWpName("");
            router.refresh();
        } catch (err) {
            console.error("建立子工作包失敗:", err);
        } finally {
            setSubSaving(false);
        }
    };

    const subWorkpackages = project.workpackages?.filter((wp: Workpackage) =>
        workpackage.childrenIds.includes(wp.id)
    ) || [];

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
                            {workpackage.status || "未開始"}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-gray-500 block mb-1">所屬專案</label>
                            <div className="font-medium">{project.projectName}</div>
                        </div>
                        <div>
                            <label className="text-gray-500 block mb-1">負責人</label>
                            <div className="font-medium">{workpackage.assignedTo || "-"}</div>
                        </div>
                        <div>
                            <label className="text-gray-500 block mb-1">開始日期</label>
                            <div className="font-medium">{workpackage.startDate || "-"}</div>
                        </div>
                        <div>
                            <label className="text-gray-500 block mb-1">結束日期</label>
                            <div className="font-medium">{workpackage.endDate || "-"}</div>
                        </div>
                        <div className="col-span-2">
                            <label className="text-gray-500 block mb-1">說明</label>
                            <div className="font-medium whitespace-pre-wrap">
                                {workpackage.description || "-"}
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className="text-gray-500 block mb-1">進度</label>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full"
                                    style={{ width: `${workpackage.progress || 0}%` }}
                                ></div>
                            </div>
                            <div className="text-right text-sm text-gray-500 mt-1">
                                {workpackage.progress || 0}%
                            </div>
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
                    <div className="mb-6 flex gap-2">
                        <input
                            type="text"
                            className="flex-1 border rounded px-3 py-2"
                            placeholder="輸入子工作包名稱"
                            value={newSubWpName}
                            onChange={e => setNewSubWpName(e.target.value)}
                            disabled={subSaving}
                        />
                        <button
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            onClick={handleAddSubWorkpackage}
                            disabled={subSaving || !newSubWpName.trim()}
                        >
                            {subSaving ? "建立中..." : "新增子工作包"}
                        </button>
                    </div>

                    {/* 子工作包列表 */}
                    {subWorkpackages.length > 0 ? (
                        <div className="space-y-4">
                            {subWorkpackages.map((subWp: Workpackage) => (
                                <div
                                    key={subWp.id}
                                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => router.push(`/owner/projects/${projectId}/workpackages/${subWp.id}`)}
                                >
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-medium">{subWp.name}</h3>
                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                            {subWp.status || "未開始"}
                                        </span>
                                    </div>
                                    {subWp.description && (
                                        <p className="mt-2 text-gray-600">{subWp.description}</p>
                                    )}
                                    <div className="mt-2 text-sm text-gray-500">
                                        建立時間：{subWp.createdAt ? new Date(subWp.createdAt).toLocaleDateString() : "-"}
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
