"use client";

import { app } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params?.projectId as string;

    const db = getFirestore(app);
    const projectRef = doc(db, 'projects', projectId);
    const [projectSnap, loading, error] = useDocument(projectRef);

    // 刪除專案
    async function handleDelete() {
        if (!window.confirm('確定要刪除此專案嗎？此動作無法復原。')) return;
        try {
            await deleteDoc(projectRef);
            router.push('/admin/projects');
        } catch {
            alert('刪除失敗');
        }
    }

    if (loading) return <div className="p-6">載入中...</div>;
    if (error) return <div className="p-6 text-red-600">發生錯誤: {error.message}</div>;
    if (!projectSnap?.exists()) return <div className="p-6">找不到專案資料</div>;

    const data = projectSnap.data();

    return (
        <div className="p-6">
            <div className="flex gap-3 mb-6">
                <Link
                    href={`/admin/projects/${projectId}/edit`}
                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition"
                >
                    編輯專案
                </Link>
                <button
                    onClick={handleDelete}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                >
                    刪除專案
                </button>
            </div>

            <div className="space-y-4 max-w-2xl">
                <h1 className="text-2xl font-bold">{data.name || '未命名專案'}</h1>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h3 className="font-medium text-gray-600">進度</h3>
                        <p>{data.progress || '-'}</p>
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-600">標題</h3>
                        <p>{data.title || '-'}</p>
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-600">開始日期</h3>
                        <p>{data.start || '-'}</p>
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-600">結束日期</h3>
                        <p>{data.end || '-'}</p>
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-600">負責人</h3>
                        <p>{data.manager || '-'}</p>
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-600">現場監工</h3>
                        <p>{data.supervisor || '-'}</p>
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-600">安全人員</h3>
                        <p>{data.safetyOfficer || '-'}</p>
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-600">狀態</h3>
                        <p>{data.status || '-'}</p>
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-600">優先順序</h3>
                        <p>{data.priority || '-'}</p>
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-600">區域</h3>
                        <p>{data.area || '-'}</p>
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-600">地址</h3>
                        <p>{data.address || '-'}</p>
                    </div>
                </div>

                <div>
                    <h3 className="font-medium text-gray-600 mb-2">描述</h3>
                    <p className="whitespace-pre-wrap">{data.description || '-'}</p>
                </div>

                {/* 功能導覽 */}
                <nav className="pt-6 space-y-2">
                    <Link 
                        href={`/admin/projects/${projectId}/tasks`}
                        className="block p-3 border rounded hover:bg-gray-50 transition"
                    >
                        施工流程設定
                    </Link>
                    <Link 
                        href={`/admin/projects/${projectId}/schedule`}
                        className="block p-3 border rounded hover:bg-gray-50 transition"
                    >
                        排班設定
                    </Link>
                </nav>
            </div>
        </div>
    );
}
