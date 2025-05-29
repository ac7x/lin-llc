"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { addDoc, collection, Timestamp } from "firebase/firestore";

export default function PhaseDetailPage() {
    const { projectId, zoneId, phaseId } = useParams() as {
        projectId: string;
        zoneId: string;
        phaseId: string;
    };
    const router = useRouter();

    // 建立工作包表單狀態
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [creating, setCreating] = useState(false);

    const handleCreateWorkPackage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        setCreating(true);
        const docRef = await addDoc(
            collection(db, "projects", projectId, "zones", zoneId, "phases", phaseId, "workpackages"),
            {
                name,
                desc,
                createdAt: Timestamp.now(),
            }
        );
        setCreating(false);
        setShowForm(false);
        setName("");
        setDesc("");
        // 建立後導向該工作包詳細頁
        router.push(`/admin/projects/${projectId}/zones/${zoneId}/phases/${phaseId}/workpackages/${docRef.id}`);
    };

    return (
        <main className="max-w-xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">階段詳細頁</h1>
            <div className="mb-2">
                <span className="font-medium">Project ID：</span>{projectId}
            </div>
            <div className="mb-2">
                <span className="font-medium">Zone ID：</span>{zoneId}
            </div>
            <div className="mb-2">
                <span className="font-medium">Phase ID：</span>{phaseId}
            </div>
            <div className="text-gray-500 text-sm mt-4">
                （此頁面可擴充顯示階段詳細資料）
            </div>
            {/* 建立工作包按鈕與表單 */}
            <div className="mt-8">
                {!showForm ? (
                    <button
                        className="bg-green-600 text-white px-4 py-2 rounded"
                        onClick={() => setShowForm(true)}
                    >
                        建立工作包
                    </button>
                ) : (
                    <form onSubmit={handleCreateWorkPackage} className="space-y-3 mt-4 bg-gray-50 p-4 rounded border">
                        <div>
                            <label className="block mb-1">工作包名稱</label>
                            <input
                                className="border px-3 py-2 w-full"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block mb-1">描述</label>
                            <textarea
                                className="border px-3 py-2 w-full"
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="bg-green-600 text-white px-4 py-2 rounded"
                                disabled={creating}
                            >
                                {creating ? "建立中..." : "建立"}
                            </button>
                            <button
                                type="button"
                                className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
                                onClick={() => setShowForm(false)}
                                disabled={creating}
                            >
                                取消
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </main>
    );
}
