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
        <div className="flex gap-8 w-full">
            {/* 左側：分區列表與新增 */}
            <div className="w-1/2 min-w-[140px] max-w-[160px]">
                <div className="flex flex-col items-center">
                    <div className="w-full">
                        <span className="font-semibold block mb-2">分區列表</span>
                        <div className="bg-white rounded-lg shadow border max-w-[140px] mx-auto pb-3 pt-2 px-2 flex flex-col items-center">
                            <ul className="space-y-2 max-h-[260px] overflow-auto w-full">
                                {loading ? (
                                    <li>載入中...</li>
                                ) : zones.length === 0 ? (
                                    <li>尚無分區</li>
                                ) : (
                                    zones.map(zone => (
                                        <li key={zone.id}>
                                            <button
                                                className={`w-full text-left border p-2 text-sm rounded-md transition-all duration-100 ${selectedZoneId === zone.id ? "bg-blue-50 border-blue-400" : "bg-white border-gray-200"} hover:bg-blue-100`}
                                                style={{ minWidth: 0 }}
                                                onClick={() => setSelectedZoneId(zone.id)}
                                            >
                                                <span className="font-semibold text-blue-700">{zone.zoneName}</span>
                                                {zone.desc && <div className="text-gray-600 text-xs">{zone.desc}</div>}
                                            </button>
                                        </li>
                                    ))
                                )}
                            </ul>
                            {/* 新增區域表單（點擊按鈕才顯示） */}
                            {showForm && (
                                <form onSubmit={handleSubmit} className="space-y-4 mt-4 bg-gray-50 p-3 rounded border w-full">
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
                            {/* 新增區域按鈕緊貼在卡片下方 */}
                            {!showForm && (
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded w-full mt-3"
                                    style={{ minWidth: 0 }}
                                    disabled={showForm}
                                >
                                    新增區域
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* 右側：分區詳情 */}
            <div className="w-1/2 min-w-[220px]">
                {/* 只顯示分區詳情 */}
                {zoneDetailLoading ? (
                    <div>載入中...</div>
                ) : !selectedZoneId ? (
                    <div className="text-gray-400">請選擇分區</div>
                ) : !zoneDetail ? (
                    <div>找不到分區資料</div>
                ) : (
                    <div className="border rounded p-4 bg-gray-50">
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
