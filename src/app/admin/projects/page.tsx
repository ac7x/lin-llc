"use client";

import { app } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { getFirestore, collection } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminProjectsPage() {
    const db = getFirestore(app);
    const projectsRef = collection(db, 'projects');
    const [projectsSnap, loading, error] = useCollection(projectsRef);
    const router = useRouter();

    return (
        <div className="pb-20">
            <h1 className="text-2xl font-bold mb-4">專案管理</h1>
            <div className="mb-6">
                <Link
                    href="/admin/projects/add"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                    新增專案
                </Link>
            </div>
            <h2 className="text-xl font-bold mb-2">專案列表</h2>
            {loading ? (
                <div>載入中...</div>
            ) : error ? (
                <div>發生錯誤: {error.message}</div>
            ) : (
                <ul className="space-y-2">
                    {projectsSnap?.docs.map(docSnap => {
                        const data = docSnap.data();
                        const id = docSnap.id;
                        return (
                            <li
                                key={id}
                                className="border p-4 rounded flex items-center justify-between hover:bg-blue-50 transition group shadow-sm"
                            >
                                <div 
                                    className="flex-1 cursor-pointer"
                                    onClick={() => router.push(`/admin/projects/${id}`)}
                                >
                                    <span className="font-bold text-lg text-blue-700 group-hover:underline group-hover:text-blue-900 transition">
                                        {data.name || '未命名專案'}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <Link
                                        href={`/admin/projects/${id}/edit`}
                                        className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition"
                                    >
                                        編輯
                                    </Link>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
