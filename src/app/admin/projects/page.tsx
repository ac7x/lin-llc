"use client";

import { useState } from 'react';
import { app } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { getFirestore, collection, updateDoc, addDoc, doc, Timestamp } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useRouter } from 'next/navigation';

export default function AdminProjectsPage() {
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [message, setMessage] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');

    const db = getFirestore(app);
    const projectsRef = collection(db, 'projects');
    const [projectsSnap, loading, error] = useCollection(projectsRef);
    const router = useRouter();

    // 新增專案
    async function createProject({ name, description }: { name: string; description: string }) {
        await addDoc(projectsRef, {
            name,
            description,
            createdAt: Timestamp.now()
        });
    }

    // 送出編輯
    async function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editingId) return;
        await updateDoc(doc(db, 'projects', editingId), {
            name: editName,
            description: editDesc
        });
        setEditingId(null);
        setEditName('');
        setEditDesc('');
    }

    // 取消編輯
    function cancelEdit() {
        setEditingId(null);
        setEditName('');
        setEditDesc('');
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMessage('');
        try {
            await createProject({ name, description: desc });
            setMessage('專案建立成功');
            setName('');
            setDesc('');
        } catch (err: unknown) {
            let errorMsg = '建立失敗: 未知錯誤';
            if (err instanceof Error) {
                errorMsg = '建立失敗: ' + err.message;
            }
            setMessage(errorMsg);
        }
    }

    return (
        <div className="pb-20">
            <h1 className="text-2xl font-bold mb-4">專案管理</h1>
            <form onSubmit={handleSubmit} className="mb-6 space-y-4">
                <div>
                    <label className="block mb-1 font-medium">專案名稱</label>
                    <input
                        className="border px-2 py-1 w-full"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block mb-1 font-medium">專案描述</label>
                    <textarea
                        className="border px-2 py-1 w-full"
                        value={desc}
                        onChange={e => setDesc(e.target.value)}
                    />
                </div>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                    建立專案
                </button>
                {message && <div className="mt-2 text-sm text-green-600">{message}</div>}
            </form>
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
                                        <textarea
                                            className="border px-2 py-1 w-full"
                                            value={editDesc}
                                            onChange={e => setEditDesc(e.target.value)}
                                        />
                                        <div className="space-x-2">
                                            <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded">儲存</button>
                                            <button type="button" className="bg-gray-400 text-white px-3 py-1 rounded" onClick={cancelEdit}>取消</button>
                                        </div>
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
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-lg text-blue-700 group-hover:underline group-hover:text-blue-900 transition">
                                            {data.name}
                                        </span>
                                        {data.manager && (
                                            <span className="ml-2 px-2 py-0.5 bg-gray-100 text-xs text-gray-700 rounded">負責人：{data.manager}</span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600 mb-1 line-clamp-2">{data.description || '—'}</div>
                                    {data.createdAt && (
                                        <div className="text-xs text-gray-400">建立於 {data.createdAt.toDate ? data.createdAt.toDate().toLocaleDateString() : ''}</div>
                                    )}
                                </div>
                                {/* 編輯與刪除按鈕已移除，僅顯示卡片內容 */}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
