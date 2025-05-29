"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

type Zone = {
    id: string;
    zoneName: string;
    desc?: string;
    createdAt?: Timestamp | Date;
};

type WorkItem = {
    id: string;
    name: string;
    desc?: string;
    createdAt?: Timestamp | Date;
};

export default function ZoneDetailPage(props: { params?: { projectId?: string; zoneId?: string } }) {
    // 支援從 props 傳入 params
    const urlParams = useParams() as { projectId?: string; zoneId?: string };
    const projectId = props.params?.projectId ?? urlParams.projectId;
    const zoneId = props.params?.zoneId ?? urlParams.zoneId;

    const [zone, setZone] = useState<Zone | null>(null);
    const [loading, setLoading] = useState(true);

    // 工項相關狀態
    const [workItems, setWorkItems] = useState<WorkItem[]>([]);
    const [workItemsLoading, setWorkItemsLoading] = useState(true);
    const [showWorkForm, setShowWorkForm] = useState(false);
    const [workName, setWorkName] = useState("");
    const [workDesc, setWorkDesc] = useState("");
    const [creatingWork, setCreatingWork] = useState(false);

    // 取得分區資料（含工項陣列）
    useEffect(() => {
        if (!projectId || !zoneId) {
            setLoading(false);
            setZone(null);
            setWorkItems([]);
            setWorkItemsLoading(false);
            return;
        }
        const fetchZone = async () => {
            const ref = doc(db, "projects", projectId, "zones", zoneId);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const data = snap.data();
                setZone({ id: snap.id, ...data, zoneName: data.zoneName } as Zone);
                setWorkItems(Array.isArray(data.workItems) ? data.workItems : []);
            } else {
                setZone(null);
                setWorkItems([]);
            }
            setLoading(false);
            setWorkItemsLoading(false);
        };
        fetchZone();
    }, [projectId, zoneId, creatingWork]);

    // 新增工項（直接更新 zone 文件的 workItems 陣列）
    const handleAddWorkItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workName) return;
        if (!projectId || !zoneId) return;
        setCreatingWork(true);

        const ref = doc(db, "projects", projectId, "zones", zoneId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
            setCreatingWork(false);
            return;
        }
        const data = snap.data();
        const oldItems: WorkItem[] = Array.isArray(data.workItems) ? data.workItems : [];
        const newItem: WorkItem = {
            id: crypto.randomUUID(),
            name: workName,
            desc: workDesc,
            createdAt: Timestamp.now(),
        };
        const newItems = [...oldItems, newItem];
        await updateDoc(ref, { workItems: newItems });

        setWorkName("");
        setWorkDesc("");
        setShowWorkForm(false);
        setCreatingWork(false);
        // 觸發刷新
    };

    if (!projectId || !zoneId) {
        return <main className="p-8 text-gray-400">請選擇分區</main>;
    }

    if (loading) {
        return <main className="p-8">載入中...</main>;
    }

    if (!zone) {
        return <main className="p-8">找不到分區資料</main>;
    }

    return (
        <main className="max-w-xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">分區：{zone.zoneName}</h1>
            <div className="mb-2">
                <span className="font-medium">描述：</span>
                {zone.desc || <span className="text-gray-400">（無描述）</span>}
            </div>
            {zone.createdAt && (
                <div className="text-gray-500 text-sm">
                    建立時間：{(() => {
                        const d = zone.createdAt instanceof Timestamp ? zone.createdAt.toDate() : zone.createdAt;
                        return d instanceof Date ? d.toLocaleString() : String(d);
                    })()}
                </div>
            )}

            {/* 工項區塊 */}
            <div className="mt-8">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold">工項列表</h2>
                    <button
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        onClick={() => setShowWorkForm(v => !v)}
                    >
                        {showWorkForm ? "取消" : "新增工項"}
                    </button>
                </div>
                {showWorkForm && (
                    <form onSubmit={handleAddWorkItem} className="mb-4 bg-gray-50 p-3 rounded border">
                        <div className="mb-2">
                            <label className="block mb-1 text-sm">工項名稱</label>
                            <input
                                className="border px-2 py-1 w-full"
                                value={workName}
                                onChange={e => setWorkName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-2">
                            <label className="block mb-1 text-sm">描述</label>
                            <textarea
                                className="border px-2 py-1 w-full"
                                value={workDesc}
                                onChange={e => setWorkDesc(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-1 rounded"
                            disabled={creatingWork}
                        >
                            {creatingWork ? "建立中..." : "建立工項"}
                        </button>
                    </form>
                )}
                {workItemsLoading ? (
                    <div className="text-gray-500">載入中...</div>
                ) : workItems.length === 0 ? (
                    <div className="text-gray-400">尚無工項</div>
                ) : (
                    <ul className="space-y-2">
                        {workItems.map(item => (
                            <li key={item.id} className="border rounded p-3 bg-white">
                                <div className="font-medium">{item.name}</div>
                                {item.desc && <div className="text-gray-600 text-sm">{item.desc}</div>}
                                {item.createdAt && (
                                    <div className="text-gray-400 text-xs">
                                        建立時間：{item.createdAt instanceof Timestamp
                                            ? item.createdAt.toDate().toLocaleString()
                                            : item.createdAt instanceof Date
                                                ? item.createdAt.toLocaleString()
                                                : String(item.createdAt)}
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

// 此檔案內容已整合進 zones/page.tsx，請直接於分區頁面操作。
