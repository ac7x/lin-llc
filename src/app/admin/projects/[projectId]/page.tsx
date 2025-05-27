"use client";

// 若未來需要可引入 firebase-client
import { app } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import React, { useState } from 'react';

import { useParams } from 'next/navigation';

export default function ProjectDetailPage() {
    const params = useParams();
    const projectId = params?.projectId as string;

    const db = getFirestore(app);
    const projectRef = doc(db, 'projects', projectId);
    const [projectSnap, loading, error] = useDocument(projectRef);

    // 狀態：是否編輯、表單欄位
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        name: '',
        description: '',
        manager: '',
        supervisor: '',
        safetyOfficer: ''
    });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    // 初始化表單欄位
    React.useEffect(() => {
        if (projectSnap?.exists()) {
            const d = projectSnap.data() || {};
            setForm({
                name: d.name || '',
                description: d.description || '',
                manager: d.manager || '',
                supervisor: d.supervisor || '',
                safetyOfficer: d.safetyOfficer || ''
            });
        }
    }, [projectSnap]);

    if (loading) return <div className="p-6">載入中...</div>;
    if (error) return <div className="p-6 text-red-600">發生錯誤: {error.message}</div>;
    if (!projectSnap?.exists()) return <div className="p-6">找不到專案資料</div>;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMsg('');
        try {
            await updateDoc(projectRef, {
                name: form.name,
                description: form.description,
                manager: form.manager,
                supervisor: form.supervisor,
                safetyOfficer: form.safetyOfficer
            });
            setMsg('儲存成功');
            setEditing(false);
        } catch (err: any) {
            setMsg('儲存失敗: ' + (err?.message || '未知錯誤'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">專案詳細頁</h1>
            <div className="mb-2 text-gray-700">專案 ID: {projectId}</div>
            {editing ? (
                <form onSubmit={handleSave} className="space-y-3 max-w-md">
                    <div>
                        <label className="font-semibold block mb-1">名稱</label>
                        <input name="name" value={form.name} onChange={handleChange} className="border px-2 py-1 w-full" required />
                    </div>
                    <div>
                        <label className="font-semibold block mb-1">描述</label>
                        <textarea name="description" value={form.description} onChange={handleChange} className="border px-2 py-1 w-full" />
                    </div>
                    <div>
                        <label className="font-semibold block mb-1">負責人</label>
                        <input name="manager" value={form.manager} onChange={handleChange} className="border px-2 py-1 w-full" />
                    </div>
                    <div>
                        <label className="font-semibold block mb-1">監工</label>
                        <input name="supervisor" value={form.supervisor} onChange={handleChange} className="border px-2 py-1 w-full" />
                    </div>
                    <div>
                        <label className="font-semibold block mb-1">公安</label>
                        <input name="safetyOfficer" value={form.safetyOfficer} onChange={handleChange} className="border px-2 py-1 w-full" />
                    </div>
                    <div className="flex gap-2 mt-2">
                        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={saving}>儲存</button>
                        <button type="button" className="bg-gray-400 text-white px-4 py-1 rounded" onClick={() => setEditing(false)} disabled={saving}>取消</button>
                    </div>
                    {msg && <div className="text-sm mt-1 text-green-700">{msg}</div>}
                </form>
            ) : (
                <div>
                    <div className="mb-2"><span className="font-semibold">名稱：</span>{form.name || '—'}</div>
                    <div className="mb-2"><span className="font-semibold">描述：</span>{form.description || '—'}</div>
                    <div className="mb-2"><span className="font-semibold">負責人：</span>{form.manager || '—'}</div>
                    <div className="mb-2"><span className="font-semibold">監工：</span>{form.supervisor || '—'}</div>
                    <div className="mb-2"><span className="font-semibold">公安：</span>{form.safetyOfficer || '—'}</div>
                    <button className="mt-4 bg-yellow-500 text-white px-4 py-1 rounded" onClick={() => setEditing(true)}>編輯</button>
                    {msg && <div className="text-sm mt-1 text-green-700">{msg}</div>}
                </div>
            )}
        </div>
    );
}
