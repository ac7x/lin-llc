"use client";

import { useParams } from "next/navigation";

export default function PhaseDetailPage() {
    const { projectId, zoneId, phaseId } = useParams() as {
        projectId: string;
        zoneId: string;
        phaseId: string;
    };

    return (
        <main className="max-w-xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">階段詳細頁</h1>
            <div className="mb-2">
                <span className="font-medium">Project ID：</span>{projectId}
            </div>
            <div className="mb-2">
                <span className="font-medium">Zone ID：</span>{zoneId}
            </div>
            <div className="mb-2">
                <span className="font-medium">Phase ID：</span>{phaseId}
            </div>
            <div className="text-gray-500 text-sm mt-4">
                （此頁面可擴充顯示階段詳細資料）
            </div>
        </main>
    );
}
