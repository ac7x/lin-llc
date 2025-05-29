"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

type Zone = {
    id: string;
    name: string;
    desc?: string;
    createdAt?: any;
};

export default function ZoneDetailPage() {
    const { projectId, zoneId } = useParams() as { projectId: string; zoneId: string };
    const [zone, setZone] = useState<Zone | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!projectId || !zoneId) return;
        const fetchZone = async () => {
            const ref = doc(db, "projects", projectId, "zones", zoneId);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                setZone({ id: snap.id, ...snap.data() } as Zone);
            } else {
                setZone(null);
            }
            setLoading(false);
        };
        fetchZone();
    }, [projectId, zoneId]);

    if (loading) {
        return <main className="p-8">載入中...</main>;
    }

    if (!zone) {
        return <main className="p-8">找不到分區資料</main>;
    }

    return (
        <main className="max-w-xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">分區：{zone.name}</h1>
            <div className="mb-2">
                <span className="font-medium">描述：</span>
                {zone.desc || <span className="text-gray-400">（無描述）</span>}
            </div>
            {zone.createdAt && (
                <div className="text-gray-500 text-sm">
                    建立時間：{zone.createdAt.toDate ? zone.createdAt.toDate().toLocaleString() : String(zone.createdAt)}
                </div>
            )}
        </main>
    );
}

// 此檔案內容已整合進 zones/page.tsx，請直接於分區頁面操作。
