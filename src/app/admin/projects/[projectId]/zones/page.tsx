"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs, addDoc, Timestamp, doc, getDoc } from "firebase/firestore";

// 分區型別
type Zone = {
    id: string;
    name: string;
    desc?: string;
    createdAt?: any;
};

export default function ZonesPage() {
    const { projectId } = useParams() as { projectId: string };
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);

    // 新增區域表單狀態
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [creating, setCreating] = useState(false);

    // tab 狀態: "list" | "detail"
    const [tab, setTab] = useState<"list" | "detail">("list");
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
    const [zoneDetail, setZoneDetail] = useState<Zone | null>(null);
    const [zoneDetailLoading, setZoneDetailLoading] = useState(false);

    useEffect(() => {
        const fetchZones = async () => {
            const snap = await getDocs(collection(db, "projects", projectId, "zones"));
            setZones(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Zone)));
            setLoading(false);
        };
        fetchZones();
    }, [projectId, creating]);

    // 取得分區詳細
    const fetchZoneDetail = async (zoneId: string) => {
        setZoneDetailLoading(true);
        const ref = doc(db, "projects", projectId, "zones", zoneId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            setZoneDetail({ id: snap.id, ...snap.data() } as Zone);
        } else {
            setZoneDetail(null);
        }
        setZoneDetailLoading(false);
    };

    // 點擊分區名稱時
    const handleZoneClick = (zoneId: string) => {
        setSelectedZoneId(zoneId);
        setTab("detail");
        fetchZoneDetail(zoneId);
    };

    // 返回列表
    const handleBackToList = () => {
        setTab("list");
        setSelectedZoneId(null);
        setZoneDetail(null);
    };

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
            <div className="flex gap-2 mb-4 border-b">
                <button
                    className={`px-4 py-2 font-semibold border-b-2 transition ${tab === "list" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600 hover:text-blue-700"}`}
                    onClick={handleBackToList}
                >
                    分區列表
                </button>
                {tab === "detail" && (
                    <button
                        className="px-4 py-2 font-semibold border-b-2 border-blue-600 text-blue-700"
                        disabled
                    >
                        分區詳情
                    </button>
                )}
            </div>
            {tab === "list" && (
                <>
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
                                    <button
                                        className="font-semibold text-blue-700 hover:underline"
                                        onClick={() => handleZoneClick(zone.id)}
                                    >
                                        {zone.name}
                                    </button>
                                    {zone.desc && <div className="text-gray-600 text-sm">{zone.desc}</div>}
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
            {tab === "detail" && (
                <div>
                    <button
                        className="mb-4 text-blue-600 hover:underline"
                        onClick={handleBackToList}
                    >
                        ← 返回分區列表
                    </button>
                    {zoneDetailLoading ? (
                        <div>載入中...</div>
                    ) : !zoneDetail ? (
                        <div>找不到分區資料</div>
                    ) : (
                        <div>
                            <h1 className="text-2xl font-bold mb-4">分區：{zoneDetail.name}</h1>
                            <div className="mb-2">
                                <span className="font-medium">描述：</span>
                                {zoneDetail.desc || <span className="text-gray-400">（無描述）</span>}
                            </div>
                            {zoneDetail.createdAt && (
                                <div className="text-gray-500 text-sm">
                                    建立時間：{zoneDetail.createdAt.toDate ? zoneDetail.createdAt.toDate().toLocaleString() : String(zoneDetail.createdAt)}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
