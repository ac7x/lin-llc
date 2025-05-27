"use client";

import { AdminBottomNav } from '@/modules/shared/interfaces/navigation/admin-bottom-nav';
import { createProject } from './actions';
import { useState } from 'react';

export default function AdminProjectsPage() {
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [message, setMessage] = useState('');

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
            <p>這是專案管理頁面的內容。</p>
            <AdminBottomNav />
        </div>
    );
}
