"use client";

// 若未來需要可引入 firebase-client
import { app } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { getFirestore, doc, updateDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';
import { useDocument, useCollection } from 'react-firebase-hooks/firestore';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useParams } from 'next/navigation';

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params?.projectId as string;

    const db = getFirestore(app);
    const projectRef = doc(db, 'projects', projectId);
    const [projectSnap, loading, error] = useDocument(projectRef);

    // 工作區域 Firestore 連結
    const workspacesRef = collection(db, 'projects', projectId, 'workspaces');
    const [workspacesSnap] = useCollection(workspacesRef);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [workspaceMsg, setWorkspaceMsg] = useState('');

    // 狀態：是否編輯、表單欄位
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        progress: '', // 進度
        title: '',    // 標題
        start: '',    // 開始
        end: '',      // 結束
        manager: '',  // 負責人
        supervisor: '', // 現場監工
        safetyOfficer: '', // 安全人員
        status: '',   // 狀態
        priority: '', // 優先
        area: '',     // 區域
        address: '',  // 地址
        workspace: '', // 工作區
        name: '',     // 舊欄位相容
        description: '' // 舊欄位相容
    });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    // 初始化表單欄位
    React.useEffect(() => {
        if (projectSnap?.exists()) {
            const d = projectSnap.data() || {};
            setForm({
                progress: d.progress || '',
                title: d.title || '',
                start: d.start || '',
                end: d.end || '',
                manager: d.manager || '',
                supervisor: d.supervisor || '',
                safetyOfficer: d.safetyOfficer || '',
                status: d.status || '',
                priority: d.priority || '',
                area: d.area || '',
                address: d.address || '',
                workspace: d.workspace || '',
                name: d.name || '',
                description: d.description || ''
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
                progress: form.progress,
                title: form.title,
                start: form.start,
                end: form.end,
                manager: form.manager,
                supervisor: form.supervisor,
                safetyOfficer: form.safetyOfficer,
                status: form.status,
                priority: form.priority,
                area: form.area,
                address: form.address,
                workspace: form.workspace,
                name: form.name,
                description: form.description
            });
            setMsg('儲存成功');
            setEditing(false);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : '未知錯誤';
            setMsg('儲存失敗: ' + errorMsg);
        } finally {
            setSaving(false);
        }
    };

    // 刪除專案
    const handleDelete = async () => {
        if (!window.confirm('確定要刪除此專案嗎？此動作無法復原。')) return;
        try {
            await deleteDoc(projectRef);
            router.push('/admin/projects');
        } catch {
            alert('刪除失敗');
        }
    };

    // 新增工作區域
    const handleAddWorkspace = async (e: React.FormEvent) => {
        e.preventDefault();
        setWorkspaceMsg('');
        if (!newWorkspaceName.trim()) return;
        try {
            await addDoc(workspacesRef, { name: newWorkspaceName });
            setNewWorkspaceName('');
            setWorkspaceMsg('新增成功');
        } catch {
            setWorkspaceMsg('新增失敗');
        }
    };
    // 刪除工作區域
    const handleDeleteWorkspace = async (id: string) => {
        if (!window.confirm('確定要刪除此工作區域？')) return;
        try {
            await deleteDoc(doc(db, 'projects', projectId, 'workspaces', id));
        } catch {
            // 錯誤處理可加上訊息顯示
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
                <h1 className="text-2xl font-bold">專案詳細頁</h1>
                <Link href={`/admin/projects/${projectId}/tasks`} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">查看任務</Link>
                <Link href={`/admin/projects/${projectId}/schedule`} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">查看排程</Link>
                <Link href={`/admin/projects/${projectId}/edit`} className="text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200">編輯</Link>
                <button onClick={handleDelete} className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200">刪除</button>
            </div>
            <div className="mb-2 text-gray-700">專案 ID: {projectId}</div>
            {editing ? (
                <form onSubmit={handleSave} className="space-y-3 max-w-md">
                    <div>
                        <label className="font-semibold block mb-1">進度</label>
                        <input name="progress" value={form.progress} onChange={handleChange} className="border px-2 py-1 w-full" />
                    </div>
                    <div>
                        <label className="font-semibold block mb-1">標題</label>
                        <input name="title" value={form.title} onChange={handleChange} className="border px-2 py-1 w-full" />
                    </div>
                    <div>
                        <label className="font-semibold block mb-1">開始</label>
                        <input name="start" value={form.start} onChange={handleChange} className="border px-2 py-1 w-full" type="date" />
                    </div>
                    <div>
                        <label className="font-semibold block mb-1">結束</label>
                        <input name="end" value={form.end} onChange={handleChange} className="border px-2 py-1 w-full" type="date" />
                    </div>
                    <div>
                        <label className="font-semibold block mb-1">負責人</label>
                        <input name="manager" value={form.manager} onChange={handleChange} className="border px-2 py-1 w-full" />
                    </div>
                    <div>
                        <label className="font-semibold block mb-1">現場監工</label>
                        <input name="supervisor" value={form.supervisor} onChange={handleChange} className="border px-2 py-1 w-full" />
                    </div>
                    <div>
                        <label className="font-semibold block mb-1">安全人員</label>
                        <input name="safetyOfficer" value={form.safetyOfficer} onChange={handleChange} className="border px-2 py-1 w-full" />
                    </div>
                    <div>
                        <label className="font-semibold block mb-1">狀態</label>
                        <input name="status" value={form.status} onChange={handleChange} className="border px-2 py-1 w-full" />
                    </div>
                    <div>
                        <label className="font-semibold block mb-1">優先</label>
                        <input name="priority" value={form.priority} onChange={handleChange} className="border px-2 py-1 w-full" />
                    </div>
                    <div>
                        <label className="font-semibold block mb-1">區域</label>
                        <input name="area" value={form.area} onChange={handleChange} className="border px-2 py-1 w-full" />
                    </div>
                    <div>
                        <label className="font-semibold block mb-1">地址</label>
                        <input name="address" value={form.address} onChange={handleChange} className="border px-2 py-1 w-full" />
                    </div>
                    <div>
                        <label className="font-semibold block mb-1">工作區</label>
                        <input name="workspace" value={form.workspace} onChange={handleChange} className="border px-2 py-1 w-full" />
                    </div>
                    <div>
                        <label className="font-semibold block mb-1">描述</label>
                        <textarea name="description" value={form.description} onChange={handleChange} className="border px-2 py-1 w-full" />
                    </div>
                    <div className="flex gap-2 mt-2">
                        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={saving}>儲存</button>
                        <button type="button" className="bg-gray-400 text-white px-4 py-1 rounded" onClick={() => setEditing(false)} disabled={saving}>取消</button>
                    </div>
                    {msg && <div className="text-sm mt-1 text-green-700">{msg}</div>}
                </form>
            ) : (
                <div>
                    <div className="mb-2"><span className="font-semibold">進度：</span>{form.progress || '—'}</div>
                    <div className="mb-2"><span className="font-semibold">標題：</span>{form.title || '—'}</div>
                    <div className="mb-2"><span className="font-semibold">開始：</span>{form.start || '—'}</div>
                    <div className="mb-2"><span className="font-semibold">結束：</span>{form.end || '—'}</div>
                    <div className="mb-2"><span className="font-semibold">負責人：</span>{form.manager || '—'}</div>
                    <div className="mb-2"><span className="font-semibold">現場監工：</span>{form.supervisor || '—'}</div>
                    <div className="mb-2"><span className="font-semibold">安全人員：</span>{form.safetyOfficer || '—'}</div>
                    <div className="mb-2"><span className="font-semibold">狀態：</span>{form.status || '—'}</div>
                    <div className="mb-2"><span className="font-semibold">優先：</span>{form.priority || '—'}</div>
                    <div className="mb-2"><span className="font-semibold">區域：</span>{form.area || '—'}</div>
                    <div className="mb-2"><span className="font-semibold">地址：</span>{form.address || '—'}</div>
                    <div className="mb-2"><span className="font-semibold">工作區：</span>{form.workspace || '—'}</div>
                    <div className="mb-2"><span className="font-semibold">描述：</span>{form.description || '—'}</div>
                    <a
                      href={`/admin/projects/${projectId}/edit`}
                      className="mt-4 bg-yellow-500 text-white px-4 py-1 rounded inline-block hover:bg-yellow-600 transition"
                    >
                      編輯
                    </a>
                    {msg && <div className="text-sm mt-1 text-green-700">{msg}</div>}
                </div>
            )}
            {/* 新增：專案相關功能導覽 */}
            <div className="mt-6 flex gap-4">
                <a
                    href={`/admin/projects/${projectId}/tasks`}
                    className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
                >
                    查看任務
                </a>
                <a
                    href={`/admin/projects/${projectId}/schedule`}
                    className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded transition"
                >
                    查看排程
                </a>
            </div>
            {/* 導覽結束 */}
            <div className="mt-8">
                <h2 className="text-lg font-bold mb-2">工作區域</h2>
                <form onSubmit={handleAddWorkspace} className="flex gap-2 mb-4">
                    <input
                        className="border px-2 py-1 flex-1"
                        value={newWorkspaceName}
                        onChange={e => setNewWorkspaceName(e.target.value)}
                        placeholder="輸入區域名稱"
                        required
                    />
                    <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">新增</button>
                </form>
                {workspaceMsg && <div className="text-green-700 mb-2">{workspaceMsg}</div>}
                <ul className="space-y-2">
                    {workspacesSnap?.docs.length === 0 && <li className="text-gray-500">尚無工作區域</li>}
                    {workspacesSnap?.docs.map(ws => (
                        <li key={ws.id} className="border p-2 rounded flex items-center justify-between">
                            <span>{ws.data().name}</span>
                            <button onClick={() => handleDeleteWorkspace(ws.id)} className="text-xs text-red-600 hover:underline">刪除</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
