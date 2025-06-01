"use client";

import { useParams } from "next/navigation";
import { useDocument } from "react-firebase-hooks/firestore";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { Project } from "@/types/project";
import { useState } from "react";

export default function ProjectDetailPage() {
    const params = useParams();
    const projectId = params?.project as string;
    const [projectDoc, loading, error] = useDocument(doc(db, "projects", projectId));
    const [tab, setTab] = useState<"info" | "create" | "edit">("info");
    const [newWorkpackageName, setNewWorkpackageName] = useState("");
    const [saving, setSaving] = useState(false);

    if (loading) return <div>載入中...</div>;
    if (error) return <div>錯誤: {error.message}</div>;
    if (!projectDoc?.exists()) return <div>找不到專案</div>;

    const project = projectDoc.data() as Project;

    const handleAddWorkpackage = async () => {
        if (!newWorkpackageName.trim()) return;
        setSaving(true);
        await updateDoc(doc(db, "projects", projectId), {
            workpackages: arrayUnion({
                id: Date.now().toString(),
                name: newWorkpackageName.trim(),
                childrenIds: [],
            }),
        });
        setNewWorkpackageName("");
        setSaving(false);
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
                    <div className="flex mt-4 gap-2">
                        <input
                            className="border px-2 py-1 rounded flex-1"
                            placeholder="工作包名稱"
                            value={newWorkpackageName}
                            onChange={e => setNewWorkpackageName(e.target.value)}
                            disabled={saving}
                        />
                        <button
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            onClick={handleAddWorkpackage}
                            disabled={saving || !newWorkpackageName.trim()}
                        >
                            新增工作包
                        </button>
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