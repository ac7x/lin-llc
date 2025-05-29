"use client";

import { useEffect, useState } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";

// 最小型別定義
type WorkItem = {
    id: string;
    itemName: string;
    createdAt: Timestamp | Date | string;
    start?: string;
    end?: string;
    quantity?: number;
};

type Zone = {
    id: string;
    zoneName: string;
    desc?: string;
    createdAt: Timestamp | Date | string;
    workItems?: WorkItem[];
};

interface Props {
    params: { projectId: string; zoneId: string };
}

export default function ZoneDetailPage({ params }: Props) {
    const { projectId, zoneId } = params;
    const [zone, setZone] = useState<Zone | null>(null);
    const [loading, setLoading] = useState(true);

    // 工項
    const [workItems, setWorkItems] = useState<WorkItem[]>([]);
    const [workName, setWorkName] = useState("");
    const [creatingWork, setCreatingWork] = useState(false);
    const [workQuantity, setWorkQuantity] = useState<number | "">("");
    const [workStart, setWorkStart] = useState("");
    const [workEnd, setWorkEnd] = useState("");

    // 取得分區資料
    useEffect(() => {
        if (!projectId || !zoneId) {
            setLoading(false);
            setZone(null);
            setWorkItems([]);
            return;
        }
        const fetchZone = async () => {
            const ref = doc(db, "projects", projectId, "zones", zoneId);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const data = snap.data() as Record<string, unknown>;
                setZone({ id: snap.id, ...data } as Zone);
                setWorkItems(
                    Array.isArray(data.workItems)
                        ? data.workItems.map((wi: Record<string, unknown>) => ({
                            id: String(wi.id),
                            itemName: String(wi.itemName ?? wi.name ?? ""),
                            createdAt:
                                typeof wi.createdAt === "string" ||
                                    wi.createdAt instanceof Timestamp ||
                                    wi.createdAt instanceof Date
                                    ? wi.createdAt
                                    : "",
                            start: typeof wi.start === "string" ? wi.start : undefined,
                            end: typeof wi.end === "string" ? wi.end : undefined,
                            quantity: typeof wi.quantity === "number" ? wi.quantity : undefined,
                        }))
                        : []
                );
            } else {
                setZone(null);
                setWorkItems([]);
            }
            setLoading(false);
        };
        fetchZone();
        // 若有新增工項時刷新
    }, [projectId, zoneId, creatingWork]);

    // 新增工項
    const handleAddWorkItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workName || !projectId || !zoneId) return;
        setCreatingWork(true);
        const ref = doc(db, "projects", projectId, "zones", zoneId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
            setCreatingWork(false);
            return;
        }
        const data = snap.data() as Record<string, unknown>;
        const oldItems: WorkItem[] = Array.isArray(data.workItems)
            ? data.workItems.map((wi: Record<string, unknown>) => ({
                id: String(wi.id),
                itemName: String(wi.itemName ?? wi.name ?? ""),
                createdAt:
                    typeof wi.createdAt === "string" ||
                        wi.createdAt instanceof Timestamp ||
                        wi.createdAt instanceof Date
                        ? wi.createdAt
                        : "",
                start: typeof wi.start === "string" ? wi.start : undefined,
                end: typeof wi.end === "string" ? wi.end : undefined,
                quantity: typeof wi.quantity === "number" ? wi.quantity : undefined,
            }))
            : [];
        const newItem: WorkItem = {
            id: crypto.randomUUID(),
            itemName: workName,
            createdAt: Timestamp.now(),
            start: workStart || undefined,
            end: workEnd || undefined,
            quantity: workQuantity === "" ? undefined : Number(workQuantity),
        };
        const newItems = [...oldItems, newItem];
        await updateDoc(ref, { workItems: newItems });

        setWorkName("");
        setWorkStart("");
        setWorkEnd("");
        setWorkQuantity("");
        setCreatingWork(false);
    };

    if (loading) return <main className="p-8">載入中...</main>;
    if (!zone) return <main className="p-8">找不到分區資料</main>;

    return (
        <main className="max-w-xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">分區：{zone.zoneName}</h1>
            <div className="mb-2">
                <span className="font-medium">描述：</span>
                {zone.desc || <span className="text-gray-400">（無描述）</span>}
            </div>
            {zone.createdAt && (
                <div className="text-gray-500 text-sm">
                    建立時間：
                    {(() => {
                        const d = zone.createdAt;
                        if (d && typeof d === "object" && "toDate" in d && typeof d.toDate === "function") {
                            const dateObj = d.toDate();
                            return dateObj instanceof Date ? dateObj.toLocaleString() : String(dateObj);
                        }
                        return typeof d === "string" ? d : "";
                    })()}
                </div>
            )}

            {/* 工項區塊 */}
            <div className="mt-8">
                <h2 className="text-lg font-bold mb-2">工項列表</h2>
                <form onSubmit={handleAddWorkItem} className="mb-4 bg-gray-50 p-3 rounded border">
                    <div className="mb-2 flex gap-2">
                        <div className="flex-1">
                            <label className="block mb-1 text-sm">工項名稱</label>
                            <input
                                className="border px-2 py-1 w-full"
                                value={workName}
                                onChange={e => setWorkName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="w-32">
                            <label className="block mb-1 text-sm">數量</label>
                            <input
                                type="number"
                                className="border px-2 py-1 w-full"
                                value={workQuantity}
                                min={0}
                                onChange={e => setWorkQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                            />
                        </div>
                    </div>
                    <div className="mb-2 flex gap-2">
                        <div className="flex-1">
                            <label className="block mb-1 text-sm">起始日</label>
                            <input
                                type="date"
                                className="border px-2 py-1 w-full"
                                value={workStart}
                                onChange={e => setWorkStart(e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block mb-1 text-sm">結束日</label>
                            <input
                                type="date"
                                className="border px-2 py-1 w-full"
                                value={workEnd}
                                onChange={e => setWorkEnd(e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-1 rounded"
                        disabled={creatingWork}
                    >
                        {creatingWork ? "建立中..." : "建立工項"}
                    </button>
                </form>
                {workItems.length === 0 ? (
                    <div className="text-gray-400">尚無工項</div>
                ) : (
                    <ul className="space-y-2">
                        {workItems.map(item => (
                            <li key={item.id} className="border rounded p-3 bg-white">
                                <div className="font-medium">{item.itemName}</div>
                                {typeof item.quantity === "number" && (
                                    <div className="text-gray-700 text-sm">數量：{item.quantity}</div>
                                )}
                                {(item.start || item.end) && (
                                    <div className="text-gray-500 text-xs mt-2">
                                        {item.start && <>起始日：{item.start} </>}
                                        {item.end && <>結束日：{item.end}</>}
                                    </div>
                                )}
                                {item.createdAt && (
                                    <div className="text-gray-400 text-xs">
                                        建立時間：
                                        {(() => {
                                            const d = item.createdAt;
                                            if (d && typeof d === "object" && "toDate" in d && typeof d.toDate === "function") {
                                                const dateObj = d.toDate();
                                                return dateObj instanceof Date ? dateObj.toLocaleString() : String(dateObj);
                                            }
                                            return typeof d === "string" ? d : "";
                                        })()}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    );
}