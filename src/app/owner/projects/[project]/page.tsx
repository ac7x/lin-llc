"use client";

import { useParams } from "next/navigation";
import { useDocument } from "react-firebase-hooks/firestore";
import { doc } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { Project } from "@/types/project";

export default function ProjectDetailPage() {
    const params = useParams();
    const projectId = params?.project as string;
    const [projectDoc, loading, error] = useDocument(doc(db, "projects", projectId));

    if (loading) return <div>載入中...</div>;
    if (error) return <div>錯誤: {error.message}</div>;
    if (!projectDoc?.exists()) return <div>找不到專案</div>;

    const project = projectDoc.data() as Project;

    return (
        <main className="max-w-4xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">{project.projectName}</h1>

            {/* 專案基本資訊 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">專案資訊</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-gray-500">協調者</label>
                        <div>{project.coordinator || '-'}</div>
                    </div>
                    <div>
                        <label className="text-gray-500">監工</label>
                        <div>{project.supervisor || '-'}</div>
                    </div>
                    <div>
                        <label className="text-gray-500">安全人員</label>
                        <div>{project.safetyOfficer || '-'}</div>
                    </div>
                    <div>
                        <label className="text-gray-500">地區</label>
                        <div>{project.region || '-'}</div>
                    </div>
                    <div>
                        <label className="text-gray-500">地址</label>
                        <div>{project.address || '-'}</div>
                    </div>
                    <div>
                        <label className="text-gray-500">起始日</label>
                        <div>{project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}</div>
                    </div>
                    <div>
                        <label className="text-gray-500">預估結束日</label>
                        <div>{project.estimatedEndDate ? new Date(project.estimatedEndDate).toLocaleDateString() : '-'}</div>
                    </div>
                    <div>
                        <label className="text-gray-500">業主</label>
                        <div>{project.owner || '-'}</div>
                    </div>
                </div>
            </div>
        </main>
    );
}