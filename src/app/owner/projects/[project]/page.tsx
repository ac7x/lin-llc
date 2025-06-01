"use client";

import { useParams, useRouter } from "next/navigation";
import { useDocument } from "react-firebase-hooks/firestore";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { Project } from "@/types/project";
import { Workpackage } from "@/types/workpackage";
import { useState } from "react";

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params?.project as string;
    const [projectDoc, loading, error] = useDocument(doc(db, "projects", projectId));
    const [tab, setTab] = useState<"info" | "create" | "edit">("info");
    const [newWorkpackage, setNewWorkpackage] = useState({
        name: "",
        description: "",
        category: "",
        priority: "medium" as "low" | "medium" | "high",
    });
    const [saving, setSaving] = useState(false);

    if (loading) return <div>載入中...</div>;
    if (error) return <div>錯誤: {error.message}</div>;
    if (!projectDoc?.exists()) return <div>找不到專案</div>;

    const project = projectDoc.data() as Project;

    const handleAddWorkpackage = async () => {
        if (!newWorkpackage.name.trim()) return;
        setSaving(true);
        try {
            const newWp: Workpackage = {
                id: Date.now().toString(),
                name: newWorkpackage.name.trim(),
                description: newWorkpackage.description,
                category: newWorkpackage.category,
                priority: newWorkpackage.priority,
                status: "新建立",
                progress: 0,
                createdAt: new Date().toISOString(),
                subWorkpackages: [],
            };

            const updatedWorkpackages = [...(project.workpackages || []), newWp];
            await updateDoc(doc(db, "projects", projectId), {
                workpackages: updatedWorkpackages,
            });

            setNewWorkpackage({
                name: "",
                description: "",
                category: "",
                priority: "medium",
            });
        } catch (error) {
            console.error("建立工作包失敗:", error);
        } finally {
            setSaving(false);
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
                    專案資訊
                </button>
                <button
                    className={`px-4 py-2 -mb-px border-b-2 ${tab === "create" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-gray-600"}`}
                    onClick={() => setTab("create")}
                >
                    建立工作包
                </button>
                <button
                    className={`px-4 py-2 -mb-px border-b-2 ${tab === "edit" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-gray-600"}`}
                    onClick={() => setTab("edit")}
                >
                    編輯資訊
                </button>
            </div>
            {/* Tab Content */}
            {tab === "info" && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">專案資訊</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-gray-500">協調者</label>
                            <div>{project.coordinator || '-'}</div>
                        </div>
                        <div>
                            <label className="text-gray-500">監工</label>
                            <div>{project.supervisor || '-'}</div>
                        </div>
                        <div>
                            <label className="text-gray-500">安全人員</label>
                            <div>{project.safetyOfficer || '-'}</div>
                        </div>
                        <div>
                            <label className="text-gray-500">地區</label>
                            <div>{project.region || '-'}</div>
                        </div>
                        <div>
                            <label className="text-gray-500">地址</label>
                            <div>{project.address || '-'}</div>
                        </div>
                        <div>
                            <label className="text-gray-500">起始日</label>
                            <div>{project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}</div>
                        </div>
                        <div>
                            <label className="text-gray-500">預估結束日</label>
                            <div>{project.estimatedEndDate ? new Date(project.estimatedEndDate).toLocaleDateString() : '-'}</div>
                        </div>
                        <div>
                            <label className="text-gray-500">業主</label>
                            <div>{project.owner || '-'}</div>
                        </div>
                    </div>
                </div>
            )}
            {tab === "create" && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">建立工作包</h2>
                    <div>專案名稱：{project.projectName}</div>
                    {/* 新增工作包表單 */}
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">工作包名稱</label>
                            <input
                                className="border px-3 py-2 rounded w-full"
                                placeholder="工作包名稱"
                                value={newWorkpackage.name}
                                onChange={e => setNewWorkpackage(prev => ({ ...prev, name: e.target.value }))}
                                disabled={saving}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">描述</label>
                            <textarea
                                className="border px-3 py-2 rounded w-full"
                                placeholder="工作包描述"
                                value={newWorkpackage.description}
                                onChange={e => setNewWorkpackage(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                disabled={saving}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">類別</label>
                            <input
                                className="border px-3 py-2 rounded w-full"
                                placeholder="工作包類別"
                                value={newWorkpackage.category}
                                onChange={e => setNewWorkpackage(prev => ({ ...prev, category: e.target.value }))}
                                disabled={saving}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">優先級</label>
                            <select
                                className="border px-3 py-2 rounded w-full"
                                value={newWorkpackage.priority}
                                onChange={e => setNewWorkpackage(prev => ({ ...prev, priority: e.target.value as "low" | "medium" | "high" }))}
                                disabled={saving}
                            >
                                <option value="low">低</option>
                                <option value="medium">中</option>
                                <option value="high">高</option>
                            </select>
                        </div>
                        <div className="pt-2">
                            <button
                                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                onClick={handleAddWorkpackage}
                                disabled={saving || !newWorkpackage.name.trim()}
                            >
                                {saving ? "建立中..." : "新增工作包"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {tab === "edit" && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">編輯專案資訊</h2>
                    <div>專案名稱：{project.projectName}</div>
                    {/* 這裡可放編輯專案資訊表單 */}
                </div>
            )}
        </main>
    );
}