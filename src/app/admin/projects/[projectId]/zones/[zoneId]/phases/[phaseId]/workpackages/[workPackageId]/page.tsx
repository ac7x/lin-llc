"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { doc, getDoc, Timestamp } from "firebase/firestore";

type WorkPackage = {
    id: string;
    name: string;
    desc?: string;
    createdAt?: Timestamp | Date;
};

export default function WorkPackageDetailPage() {
    const { projectId, zoneId, phaseId, workPackageId } = useParams() as {
        projectId: string;
        zoneId: string;
        phaseId: string;
        workPackageId: string;
    };
    const [workPackage, setWorkPackage] = useState<WorkPackage | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!projectId || !zoneId || !phaseId || !workPackageId) return;
        const fetchWorkPackage = async () => {
            const ref = doc(db, "projects", projectId, "zones", zoneId, "phases", phaseId, "workpackages", workPackageId);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                setWorkPackage({ id: snap.id, ...snap.data() } as WorkPackage);
            } else {
                setWorkPackage(null);
            }
            setLoading(false);
        };
        fetchWorkPackage();
    }, [projectId, zoneId, phaseId, workPackageId]);

    if (loading) {
        return <main className="p-8">載入中...</main>;
    }

    if (!workPackage) {
        return <main className="p-8">找不到工作包資料</main>;
    }

    return (
        <main className="max-w-xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">工作包：{workPackage.name}</h1>
            <div className="mb-2">
                <span className="font-medium">描述：</span>
                {workPackage.desc || <span className="text-gray-400">（無描述）</span>}
            </div>
            {workPackage.createdAt && (
                <div className="text-gray-500 text-sm">
                    建立時間：
                    {workPackage.createdAt instanceof Timestamp
                        ? workPackage.createdAt.toDate().toLocaleString()
                        : workPackage.createdAt instanceof Date
                            ? workPackage.createdAt.toLocaleString()
                            : String(workPackage.createdAt)}
                </div>
            )}
        </main>
    );
}
