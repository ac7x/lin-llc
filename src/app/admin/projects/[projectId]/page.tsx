"use client";

import { useParams } from 'next/navigation';

export default function ProjectDetailPage() {
    const params = useParams();
    const projectId = params?.projectId;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">專案詳細頁</h1>
            <p>專案 ID: {projectId}</p>
            {/* 這裡可以顯示更多專案資訊 */}
        </div>
    );
}
