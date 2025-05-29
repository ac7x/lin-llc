"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs, addDoc, Timestamp, doc, getDoc } from "firebase/firestore";

// 分區型別
type Zone = {
    id: string;
    zoneName: string;
    desc?: string;
    createdAt?: Timestamp | Date;
};

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
    const [zoneDetail, setZoneDetail] = useState<Zone | null>(null);
    const [zoneDetailLoading, setZoneDetailLoading] = useState(false);

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
            setZoneDetail(null);
            return;
        }
        setZoneDetailLoading(true);
        const fetchZoneDetail = async () => {
            const ref = doc(db, "projects", projectId, "zones", selectedZoneId);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                setZoneDetail({ id: snap.id, ...snap.data() } as Zone);
            } else {
                setZoneDetail(null);
            }
            setZoneDetailLoading(false);
        };
        fetchZoneDetail();
    }, [projectId, selectedZoneId]);

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
                            className={`px-4 py-2 font-semibold border-b-2 transition whitespace-nowrap ${selectedZoneId === zone.id ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600 hover:text-blue-700"}`}
                            onClick={() => setSelectedZoneId(zone.id)}
                        >
                            {zone.zoneName}
                        </button>
                    ))
                )}
                {/* 新增分區按鈕 */}
                <button
                    onClick={() => setShowForm(true)}
                    className="ml-2 px-3 py-1.5 text-sm rounded bg-blue-600 text-white font-semibold"
                    style={{ minWidth: 0, height: "36px" }}
                    disabled={showForm}
                >
                    新增區域
                </button>
            </div>
            {/* 新增區域表單（橫向tab下方） */}
            {showForm && (
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
                            onClick={() => setShowForm(false)}
                            disabled={creating}
                        >
                            取消
                        </button>
                    </div>
                </form>
            )}
            {/* 分區詳情 */}
            <div className="w-full">
                {zoneDetailLoading ? (
                    <div>載入中...</div>
                ) : !selectedZoneId ? (
                    <div className="text-gray-400">請選擇分區</div>
                ) : !zoneDetail ? (
                    <div>找不到分區資料</div>
                ) : (
                    <div className="border rounded p-4 bg-gray-50 max-w-xl">
                        <h2 className="text-lg font-bold mb-2">{zoneDetail.zoneName}</h2>
                        <div className="mb-2">
                            <span className="font-medium">描述：</span>
                            {zoneDetail.desc || <span className="text-gray-400">（無描述）</span>}
                        </div>
                        {zoneDetail.createdAt && (
                            <div className="text-gray-500 text-sm">
                                建立時間：
                                {zoneDetail.createdAt instanceof Timestamp
                                    ? zoneDetail.createdAt.toDate().toLocaleString()
                                    : zoneDetail.createdAt instanceof Date
                                        ? zoneDetail.createdAt.toLocaleString()
                                        : String(zoneDetail.createdAt)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
