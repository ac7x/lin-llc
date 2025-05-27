"use client";

import { app } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { getFirestore, collection } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useRouter } from 'next/navigation';

export default function AdminWorkTemplatesPage() {
    const db = getFirestore(app);
    const templatesRef = collection(db, 'templates');
    const [templatesSnap, loading, error] = useCollection(templatesRef);
    const router = useRouter();

    return (
        <div className="pb-20 max-w-2xl mx-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <h1 className="text-2xl font-bold mb-4">施工種類管理</h1>
            <p className="mb-6 text-gray-600 dark:text-gray-300">管理所有施工種類（範本），點擊卡片可進入設定施工流程。</p>
            <div className="mb-6">
                <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-700 transition"
                    onClick={() => router.push('/admin/templates/add')}
                >
                    新增範本
                </button>
            </div>
            {loading ? (
                <div>載入中...</div>
            ) : error ? (
                <div className="text-red-600 dark:text-red-400">發生錯誤: {error.message}</div>
            ) : (
                <ul className="space-y-3">
                    {templatesSnap?.docs.length === 0 && (
                        <li className="text-gray-500 dark:text-gray-400">尚無施工種類</li>
                    )}
                    {templatesSnap?.docs.map(docSnap => {
                        const data = docSnap.data();
                        return (
                            <li
                                key={docSnap.id}
                                className="border p-4 rounded cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 transition group shadow-sm dark:border-gray-700 dark:bg-gray-800"
                                onClick={() => router.push(`/admin/templates/${docSnap.id}`)}
                                tabIndex={0}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        router.push(`/admin/templates/${docSnap.id}`);
                                    }
                                }}
                                role="button"
                                aria-label={`前往種類 ${data.name || docSnap.id} 詳細頁`}
                            >
                                <div className="font-bold text-lg text-blue-700 group-hover:underline group-hover:text-blue-900 transition dark:text-blue-400 dark:group-hover:text-blue-200">
                                    {data.name || docSnap.id}
                                </div>
                                <div className="text-sm text-gray-600 mt-1 line-clamp-2 dark:text-gray-300">{data.description || '—'}</div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
