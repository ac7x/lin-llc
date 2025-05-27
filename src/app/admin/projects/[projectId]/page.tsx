"use client";

// 若未來需要可引入 firebase-client
import { app } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { getFirestore, doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';

import { useParams } from 'next/navigation';

export default function ProjectDetailPage() {
    const params = useParams();
    const projectId = params?.projectId as string;

    const db = getFirestore(app);
    const projectRef = doc(db, 'projects', projectId);
    const [projectSnap, loading, error] = useDocument(projectRef);

    if (loading) return <div className="p-6">載入中...</div>;
    if (error) return <div className="p-6 text-red-600">發生錯誤: {error.message}</div>;
    if (!projectSnap?.exists()) return <div className="p-6">找不到專案資料</div>;

    const data = projectSnap.data() || {};

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">專案詳細頁</h1>
            <div className="mb-2 text-gray-700">專案 ID: {projectId}</div>
            <div className="mb-2">
                <span className="font-semibold">名稱：</span>{data.name || '—'}
            </div>
            <div className="mb-2">
                <span className="font-semibold">描述：</span>{data.description || '—'}
            </div>
            <div className="mb-2">
                <span className="font-semibold">負責人：</span>{data.manager || '—'}
            </div>
            <div className="mb-2">
                <span className="font-semibold">監工：</span>{data.supervisor || '—'}
            </div>
            <div className="mb-2">
                <span className="font-semibold">公安：</span>{data.safetyOfficer || '—'}
            </div>
        </div>
    );
}
