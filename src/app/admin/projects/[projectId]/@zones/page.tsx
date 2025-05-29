"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

type Zone = {
    id: string;
    zoneName: string;
};

export default function ZonesPage() {
    const { projectId } = useParams() as { projectId: string };
    const [zoneName, setZoneName] = useState("");
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 取得 zones 列表
    useEffect(() => {
        if (!projectId) return;
        setLoading(true);
        getDocs(collection(db, "projects", projectId, "zones"))
            .then(snap => {
                setZones(
                    snap.docs.map(doc => ({
                        id: doc.id,
                        zoneName: doc.data().zoneName || doc.id,
                    }))
                );
            })
            .catch(() => setError("載入分區失敗"))
            .finally(() => setLoading(false));
    }, [projectId, adding]);

    // 建立分區
    const handleAddZone = async () => {
        if (!zoneName.trim()) return;
        setAdding(true);
        setError(null);
        try {
            await addDoc(collection(db, "projects", projectId, "zones"), {
                zoneName: zoneName.trim(),
            });
            setZoneName("");
        } catch {
            setError("建立分區失敗");
        } finally {
            setAdding(false);
        }
    };

    return (
        <main className="max-w-xl mx-auto px-4 py-8">
            <h2 className="text-xl font-bold mb-4">分區管理</h2>
            <div className="mb-6 flex gap-2">
                <input
                    type="text"
                    value={zoneName}
                    onChange={e => setZoneName(e.target.value)}
                    placeholder="分區名稱"
                    className="px-3 py-2 border border-gray-300 rounded w-64"
                    disabled={adding}
                />
                <button
                    onClick={handleAddZone}
                    disabled={adding || !zoneName.trim()}
                    className="bg-blue-700 hover:bg-blue-800 text-white rounded px-4 py-2 font-semibold disabled:opacity-60"
                >
                    {adding ? "建立中..." : "建立分區"}
                </button>
            </div>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            {loading ? (
                <div>載入中...</div>
            ) : (
                <ul className="list-disc ml-6">
                    {zones.length === 0 ? (
                        <li className="text-gray-400">尚無分區</li>
                    ) : (
                        zones.map(z => (
                            <li key={z.id}>{z.zoneName}</li>
                        ))
                    )}
                </ul>
            )}
        </main>
    );
}
