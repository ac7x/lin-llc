"use client";

import { useParams } from "next/navigation";
import { useDocument } from "react-firebase-hooks/firestore";
import { doc } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { Project, Zone } from "@/types/project";

export default function ZoneDetailPage() {
    const params = useParams();
    const projectId = params?.project as string;
    const zoneId = params?.zone as string;
    const [projectDoc, loading, error] = useDocument(doc(db, "projects", projectId));

    if (loading) return <div>載入中...</div>;
    if (error) return <div>錯誤: {error.message}</div>;
    if (!projectDoc?.exists()) return <div>找不到專案</div>;

    const project = projectDoc.data() as Project;
    const zone = project.zones.find((z: Zone) => z.zoneId === zoneId); // zones 作為陣列進行查找

    if (!zone) return <div>找不到分區</div>;

    return (
        <main className="max-w-3xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">{zone.zoneName}</h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <div className="mb-2">
                    <span className="text-gray-500">分區描述：</span>
                    <span>{zone.desc || "暫無描述"}</span>
                </div>
                <div className="mb-2">
                    <span className="text-gray-500">建立時間：</span>
                    <span>{zone.createdAt instanceof Date ? zone.createdAt.toLocaleString() : String(zone.createdAt)}</span>
                </div>
                <div className="mb-2">
                    <span className="text-gray-500">排序：</span>
                    <span>{zone.order ?? "-"}</span>
                </div>
            </div>
            <div className="text-gray-400 text-sm">
                所屬專案：{project.projectName}
            </div>
        </main>
    );
}
