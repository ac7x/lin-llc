"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs, addDoc, Timestamp, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

// 分區型別
type Zone = {
    id: string;
    zoneName: string;
    desc?: string;
    createdAt?: Timestamp | Date;
};

// Phase 型別
type Phase = {
    id: string;
    phaseName: string;
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

    // 新增階段表單狀態
    const [showPhaseForm, setShowPhaseForm] = useState(false);
    const [phaseName, setPhaseName] = useState("");
    const [phaseCreating, setPhaseCreating] = useState(false);

    // 分頁 tab 狀態
    const [tab, setTab] = useState<"detail" | "phases">("detail");
    const [phases, setPhases] = useState<Phase[]>([]);
    const [phasesLoading, setPhasesLoading] = useState(false);

    const router = useRouter();

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

    // 取得分區 phases
    useEffect(() => {
        if (!selectedZoneId) {
            setPhases([]);
            return;
        }
        if (tab !== "phases") return;
        setPhasesLoading(true);
        getDocs(collection(db, "projects", projectId, "zones", selectedZoneId, "phases"))
            .then(snap => {
                setPhases(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Phase)));
            })
            .finally(() => setPhasesLoading(false));
    }, [projectId, selectedZoneId, tab, showPhaseForm]);

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

    // 建立階段
    const handleCreatePhase = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedZoneId || !phaseName) return;
        setPhaseCreating(true);
        const docRef = await addDoc(
            collection(db, "projects", projectId, "zones", selectedZoneId, "phases"),
            {
                phaseName,
                createdAt: Timestamp.now(),
            }
        );
        setPhaseName("");
        setShowPhaseForm(false);
        setPhaseCreating(false);
        // 導向新 phase 詳細頁
        router.push(`/admin/projects/${projectId}/zones/${selectedZoneId}/phases/${docRef.id}`);
    };

    return (
        <main className="max-w-4xl mx-auto p-8">
            <div className="flex gap-8">
                {/* 左側：分區列表與新增 */}
                <div className="w-1/2 min-w-[220px]">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold">分區列表</span>
                    </div>
                    {loading ? (
                        <div>載入中...</div>
                    ) : (
                        <ul className="space-y-2">
                            {zones.length === 0 && <li>尚無分區</li>}
                            {zones.map(zone => (
                                <li key={zone.id}>
                                    <button
                                        className={`w-full text-left border p-3 rounded ${selectedZoneId === zone.id ? "bg-blue-50 border-blue-400" : ""} hover:bg-blue-100`}
                                        onClick={() => setSelectedZoneId(zone.id)}
                                    >
                                        <span className="font-semibold text-blue-700">{zone.zoneName}</span>
                                        {zone.desc && <div className="text-gray-600 text-sm">{zone.desc}</div>}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    {/* 新增區域表單（點擊按鈕才顯示） */}
                    {showForm && (
                        <form onSubmit={handleSubmit} className="space-y-4 mb-4 mt-6 bg-gray-50 p-4 rounded border">
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
                    {/* 新增區域按鈕永遠顯示在最下方 */}
                    <div className="mt-6">
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
                            disabled={showForm}
                        >
                            新增區域
                        </button>
                    </div>
                </div>
                {/* 右側：分區詳情 */}
                <div className="w-1/2 min-w-[220px]">
                    {/* phases tab 切換 */}
                    <div className="flex gap-2 mb-2">
                        <button
                            className={`px-3 py-1 font-semibold border-b-2 ${tab === "detail" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600 hover:text-blue-700"}`}
                            onClick={() => setTab("detail")}
                        >
                            分區詳情
                        </button>
                        <button
                            className={`px-3 py-1 font-semibold border-b-2 ${tab === "phases" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600 hover:text-blue-700"}`}
                            onClick={() => setTab("phases")}
                        >
                            階段列表
                        </button>
                    </div>
                    {/* tab 內容 */}
                    {tab === "detail" && (
                        <>
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
                                    {/* 新增階段按鈕與表單 */}
                                    <div className="mt-6">
                                        {!showPhaseForm ? (
                                            <button
                                                onClick={() => setShowPhaseForm(true)}
                                                className="bg-green-600 text-white px-4 py-2 rounded"
                                            >
                                                新增階段
                                            </button>
                                        ) : (
                                            <form onSubmit={handleCreatePhase} className="space-y-2 mt-2 bg-gray-50 p-3 rounded border">
                                                <div>
                                                    <label className="block mb-1">階段名稱</label>
                                                    <input
                                                        className="border px-3 py-2 w-full"
                                                        value={phaseName}
                                                        onChange={e => setPhaseName(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="submit"
                                                        className="bg-green-600 text-white px-4 py-2 rounded"
                                                        disabled={phaseCreating}
                                                    >
                                                        {phaseCreating ? "建立中..." : "建立階段"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
                                                        onClick={() => setShowPhaseForm(false)}
                                                        disabled={phaseCreating}
                                                    >
                                                        取消
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    {tab === "phases" && (
                        <div className="border rounded p-4 bg-gray-50">
                            <div className="font-semibold mb-2">階段列表</div>
                            {phasesLoading ? (
                                <div>載入中...</div>
                            ) : phases.length === 0 ? (
                                <div className="text-gray-400">尚無階段</div>
                            ) : (
                                <ul className="space-y-2">
                                    {phases.map(phase => (
                                        <li key={phase.id} className="flex items-center justify-between border-b py-2">
                                            <div>
                                                <span className="font-semibold text-blue-700">{phase.phaseName}</span>
                                                {phase.createdAt && (
                                                    <span className="ml-2 text-gray-500 text-xs">
                                                        {phase.createdAt instanceof Timestamp
                                                            ? phase.createdAt.toDate().toLocaleString()
                                                            : phase.createdAt instanceof Date
                                                                ? phase.createdAt.toLocaleString()
                                                                : String(phase.createdAt)}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                className="text-blue-600 underline px-2"
                                                onClick={() => router.push(`/admin/projects/${projectId}/zones/${selectedZoneId}/phases/${phase.id}`)}
                                            >
                                                查看
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {/* 新增階段按鈕與表單（可選擇是否顯示） */}
                            <div className="mt-4">
                                {!showPhaseForm ? (
                                    <button
                                        onClick={() => setShowPhaseForm(true)}
                                        className="bg-green-600 text-white px-4 py-2 rounded"
                                    >
                                        新增階段
                                    </button>
                                ) : (
                                    <form onSubmit={handleCreatePhase} className="space-y-2 mt-2 bg-gray-50 p-3 rounded border">
                                        <div>
                                            <label className="block mb-1">階段名稱</label>
                                            <input
                                                className="border px-3 py-2 w-full"
                                                value={phaseName}
                                                onChange={e => setPhaseName(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="submit"
                                                className="bg-green-600 text-white px-4 py-2 rounded"
                                                disabled={phaseCreating}
                                            >
                                                {phaseCreating ? "建立中..." : "建立階段"}
                                            </button>
                                            <button
                                                type="button"
                                                className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
                                                onClick={() => setShowPhaseForm(false)}
                                                disabled={phaseCreating}
                                            >
                                                取消
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
