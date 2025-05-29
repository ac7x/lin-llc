"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";

type Zone = {
    id: string;
    name: string;
    desc?: string;
};

export default function ZonesPage() {
    const router = useRouter();
    const { projectId } = useParams() as { projectId: string };
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);

    // 新增區域表單狀態
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        const fetchZones = async () => {
            const snap = await getDocs(collection(db, "projects", projectId, "zones"));
            setZones(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Zone)));
            setLoading(false);
        };
        fetchZones();
    }, [projectId, creating]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        setCreating(true);
        await addDoc(collection(db, "projects", projectId, "zones"), {
            name,
            desc,
            createdAt: Timestamp.now(),
        });
        setName("");
        setDesc("");
        setShowForm(false);
        setCreating(false);
        // 會自動刷新列表
    };

    return (
        <main className="max-w-2xl mx-auto p-8">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold">分區列表</h1>
                <button
                    onClick={() => setShowForm(v => !v)}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                >
                    {showForm ? "取消" : "新增區域"}
                </button>
            </div>
            {showForm && (
                <form onSubmit={handleSubmit} className="space-y-4 mb-6 bg-gray-50 p-4 rounded border">
                    <div>
                        <label className="block mb-1">區域名稱</label>
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
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                        disabled={creating}
                    >
                        {creating ? "建立中..." : "建立區域"}
                    </button>
                </form>
            )}
            {loading ? (
                <div>載入中...</div>
            ) : (
                <ul className="space-y-2">
                    {zones.length === 0 && <li>尚無分區</li>}
                    {zones.map(zone => (
                        <li key={zone.id} className="border p-3 rounded">
                            <Link href={`/admin/projects/${projectId}/zones/${zone.id}`} className="font-semibold text-blue-700">
                                {zone.name}
                            </Link>
                            {zone.desc && <div className="text-gray-600 text-sm">{zone.desc}</div>}
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}
