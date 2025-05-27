"use client";

import { useState } from 'react';
import { app } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { getFirestore, collection, updateDoc, doc } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminProjectsPage() {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const db = getFirestore(app);
    const projectsRef = collection(db, 'projects');
    const [projectsSnap, loading, error] = useCollection(projectsRef);
    const router = useRouter();

    // 送出編輯
    async function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editingId) return;
        await updateDoc(doc(db, 'projects', editingId), {
            name: editName
        });
        setEditingId(null);
        setEditName('');
    }

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
                        if (editingId === id) {
                            // 編輯模式
                            return (
                                <li key={id} className="border p-2 rounded bg-yellow-50">
                                    <form onSubmit={submitEdit} className="space-y-2">
                                        <input
                                            className="border px-2 py-1 w-full"
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            required
                                        />
                                    </form>
                                </li>
                            );
                        }
                        // 一般顯示模式
                        return (
                            <li
                                key={id}
                                className="border p-4 rounded flex flex-col cursor-pointer hover:bg-blue-50 transition group shadow-sm"
                                onClick={e => {
                                    if ((e.target as HTMLElement).closest('button')) return;
                                    router.push(`/admin/projects/${id}`);
                                }}
                                tabIndex={0}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        router.push(`/admin/projects/${id}`);
                                    }
                                }}
                                role="button"
                                aria-label={`前往專案 ${data.name} 詳細頁`}
                            >
                                <div className="flex-1">
                                    <span className="font-bold text-lg text-blue-700 group-hover:underline group-hover:text-blue-900 transition">
                                        {data.name}
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
