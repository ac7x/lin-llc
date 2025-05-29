"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs, addDoc, Timestamp, doc, getDoc } from "firebase/firestore";

// 分區型別
type Zone = {
    id: string;
    zoneName: string;
    desc?: string;
    createdAt?: Timestamp | Date;
};

// 動態載入分區詳情頁
const ZoneDetailPage = dynamic(() => import("./[zoneId]/page"), { ssr: false });

export default function ZonesPage() {
    const { projectId } = useParams() as { projectId: string };
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);

    // 新增區域表單狀態
    const [showForm, setShowForm] = useState(false);
    const [zoneName, setZoneName] = useState("");
    const [desc, setDesc] = useState("");
    const [creating, setCreating] = useState(false);

    // 選取分區
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
    const [zoneDetailLoading, setZoneDetailLoading] = useState(false);

    // 新增區域 tab 狀態
    const [tab, setTab] = useState<"zone" | "add">("zone");

    useEffect(() => {
        const fetchZones = async () => {
            const snap = await getDocs(collection(db, "projects", projectId, "zones"));
            const zoneList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Zone));
            setZones(zoneList);
            setLoading(false);
            // 預設選第一個
            if (zoneList.length > 0 && !selectedZoneId) {
                setSelectedZoneId(zoneList[0].id);
            }
        };
        fetchZones();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, creating]);

    // 取得分區詳細
    useEffect(() => {
        if (!selectedZoneId) {
            setZoneDetailLoading(false);
            return;
        }
        setZoneDetailLoading(true);
        const fetchZoneDetail = async () => {
            const ref = doc(db, "projects", projectId, "zones", selectedZoneId);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                // setZoneDetail({ id: snap.id, ...snap.data() } as Zone);
            } else {
                // setZoneDetail(null);
            }
            setZoneDetailLoading(false);
        };
        fetchZoneDetail();
    }, [projectId, selectedZoneId]);

    // 當選擇分區時自動切換到 zone tab
    useEffect(() => {
        if (selectedZoneId && tab !== "zone") setTab("zone");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedZoneId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!zoneName) return;
        setCreating(true);
        await addDoc(collection(db, "projects", projectId, "zones"), {
            zoneName,
            desc,
            createdAt: Timestamp.now(),
        });
        setZoneName("");
        setDesc("");
        setShowForm(false);
        setCreating(false);
        // 會自動刷新列表
    };

    return (
        <div className="w-full">
            {/* 分區 tab 樣式 */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-neutral-700 mb-4">
                {loading ? (
                    <span className="px-4 py-2 text-gray-500">載入中...</span>
                ) : zones.length === 0 ? (
                    <span className="px-4 py-2 text-gray-400">尚無分區</span>
                ) : (
                    zones.map(zone => (
                        <button
                            key={zone.id}
                            className={`px-4 py-2 font-semibold border-b-2 transition whitespace-nowrap ${tab === "zone" && selectedZoneId === zone.id
                                ? "border-blue-600 text-blue-700"
                                : "border-transparent text-gray-600 hover:text-blue-700"
                                }`}
                            onClick={() => {
                                setSelectedZoneId(zone.id);
                                setTab("zone");
                            }}
                        >
                            {zone.zoneName}
                        </button>
                    ))
                )}
                {/* 新增分區 tab（+） */}
                <button
                    onClick={() => {
                        setTab("add");
                        setShowForm(true);
                        setSelectedZoneId(null);
                    }}
                    className={`ml-2 px-4 py-2 font-semibold border-b-2 transition text-xl flex items-center justify-center ${tab === "add"
                        ? "border-blue-600 text-blue-700 bg-blue-50"
                        : "border-transparent text-gray-600 hover:text-blue-700"
                        }`}
                    style={{ minWidth: 0, height: "40px" }}
                    aria-label="新增區域"
                >
                    +
                </button>
            </div>
            {/* 新增區域表單（tab內容） */}
            {tab === "add" && showForm && (
                <form onSubmit={handleSubmit} className="space-y-4 mb-6 bg-gray-50 p-4 rounded border max-w-md">
                    <div>
                        <label className="block mb-1">區域名稱</label>
                        <input
                            className="border px-3 py-2 w-full"
                            value={zoneName}
                            onChange={e => setZoneName(e.target.value)}
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
                            className="bg-blue-600 text-white px-4 py-2 rounded"
                            disabled={creating}
                        >
                            {creating ? "建立中..." : "建立區域"}
                        </button>
                        <button
                            type="button"
                            className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
                            onClick={() => {
                                setShowForm(false);
                                setTab("zone");
                                // 若有分區則預設選第一個
                                if (zones.length > 0) setSelectedZoneId(zones[0].id);
                            }}
                            disabled={creating}
                        >
                            取消
                        </button>
                    </div>
                </form>
            )}
            {/* 分區詳情 */}
            {tab === "zone" && (
                <div className="w-full">
                    {zoneDetailLoading ? (
                        <div>載入中...</div>
                    ) : !selectedZoneId ? (
                        <div className="text-gray-400">請選擇分區</div>
                    ) : (
                        // 直接渲染 ZoneDetailPage，並傳遞必要參數
                        <ZoneDetailPage
                            params={{ projectId: projectId, zoneId: selectedZoneId }}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
