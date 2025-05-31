"use client";

import { useParams, useRouter } from "next/navigation";
import { useDocument } from "react-firebase-hooks/firestore";
import { doc } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params?.project as string;
    const [projectDoc, loading, error] = useDocument(projectId ? doc(db, "finance", "default", "projects", projectId) : null);

    if (loading) {
        return <main className="max-w-xl mx-auto px-4 py-8"><div>載入中...</div></main>;
    }
    if (error) {
        return <main className="max-w-xl mx-auto px-4 py-8"><div className="text-red-500">{String(error)}</div></main>;
    }
    if (!projectDoc || !projectDoc.exists()) {
        return <main className="max-w-xl mx-auto px-4 py-8"><div className="text-gray-400">找不到專案</div></main>;
    }

    const data = projectDoc.data();
    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : null);

    return (
        <main className="max-w-xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">專案詳情</h1>
            <div className="mb-4">
                <div><span className="font-bold">專案名稱：</span> {data.projectName || projectId}</div>
                <div><span className="font-bold">專案ID：</span> {projectId}</div>
                <div><span className="font-bold">合約ID：</span> {data.contractId ?? '-'}</div>
                <div><span className="font-bold">建立日期：</span> {createdAt ? createdAt.toLocaleDateString() : "-"}</div>
                <div><span className="font-bold">狀態：</span> {data.status ?? '-'}</div>
            </div>
            <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => router.push("/owner/projects")}>返回列表</button>
        </main>
    );
}