"use client";

import { app } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminWorkTemplatesPage() {
    const db = getFirestore(app);
    const templatesRef = collection(db, 'work-templates');
    const [templatesSnap, loading, error] = useCollection(templatesRef);
    const router = useRouter();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [msg, setMsg] = useState('');

    // 建立範本
    async function handleCreateTemplate(e: React.FormEvent) {
        e.preventDefault();
        setMsg('');
        try {
            await addDoc(templatesRef, {
                name,
                description,
                createdAt: new Date()
            });
            setName('');
            setDescription('');
            setMsg('範本建立成功');
        } catch (err) {
            setMsg('建立失敗');
        }
    }

    return (
        <div className="pb-20 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">範本管理</h1>
            <p className="mb-6 text-gray-600">管理所有工作範本，點擊卡片可進入詳細設定。</p>
            <form onSubmit={handleCreateTemplate} className="mb-6 space-y-4">
                <div>
                    <label className="block mb-1 font-medium">範本名稱</label>
                    <input
                        className="border px-2 py-1 w-full"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block mb-1 font-medium">描述</label>
                    <textarea
                        className="border px-2 py-1 w-full"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={2}
                    />
                </div>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                    建立範本
                </button>
                {msg && <div className="mt-2 text-sm text-green-600">{msg}</div>}
            </form>
            {loading ? (
                <div>載入中...</div>
            ) : error ? (
                <div className="text-red-600">發生錯誤: {error.message}</div>
            ) : (
                <ul className="space-y-3">
                    {templatesSnap?.docs.length === 0 && (
                        <li className="text-gray-500">尚無範本</li>
                    )}
                    {templatesSnap?.docs.map(docSnap => {
                        const data = docSnap.data();
                        return (
                            <li
                                key={docSnap.id}
                                className="border p-4 rounded cursor-pointer hover:bg-blue-50 transition group shadow-sm"
                                onClick={() => router.push(`/admin/work-templates/${docSnap.id}`)}
                                tabIndex={0}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        router.push(`/admin/work-templates/${docSnap.id}`);
                                    }
                                }}
                                role="button"
                                aria-label={`前往範本 ${data.name || docSnap.id} 詳細頁`}
                            >
                                <div className="font-bold text-lg text-blue-700 group-hover:underline group-hover:text-blue-900 transition">
                                    {data.name || docSnap.id}
                                </div>
                                <div className="text-sm text-gray-600 mt-1 line-clamp-2">{data.description || '—'}</div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
