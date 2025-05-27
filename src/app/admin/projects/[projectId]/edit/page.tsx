"use client";

import { useEffect, useState } from 'react';
import { app } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const db = getFirestore(app);
  const projectRef = doc(db, 'projects', projectId);

  // 搬移詳細頁的所有欄位
  const [form, setForm] = useState({
    progress: '',
    title: '',
    start: '',
    end: '',
    manager: '',
    supervisor: '',
    safetyOfficer: '',
    status: '',
    priority: '',
    area: '',
    address: '',
    workspace: '',
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const snap = await getDoc(projectRef);
      if (snap.exists()) {
        const d = snap.data() || {};
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
      setLoading(false);
    }
    fetchData();
  }, [projectId, projectRef]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
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
      setTimeout(() => router.push(`/admin/projects/${projectId}`), 800);
    } catch (err: unknown) {
      let errorMsg = '儲存失敗: 未知錯誤';
      if (err instanceof Error) errorMsg = '儲存失敗: ' + err.message;
      setMsg(errorMsg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">載入中...</div>;

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">編輯專案</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">進度</label>
          <input name="progress" value={form.progress} onChange={handleChange} className="border px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block mb-1 font-medium">標題</label>
          <input name="title" value={form.title} onChange={handleChange} className="border px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block mb-1 font-medium">開始</label>
          <input name="start" value={form.start} onChange={handleChange} className="border px-2 py-1 w-full" type="date" />
        </div>
        <div>
          <label className="block mb-1 font-medium">結束</label>
          <input name="end" value={form.end} onChange={handleChange} className="border px-2 py-1 w-full" type="date" />
        </div>
        <div>
          <label className="block mb-1 font-medium">負責人</label>
          <input name="manager" value={form.manager} onChange={handleChange} className="border px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block mb-1 font-medium">現場監工</label>
          <input name="supervisor" value={form.supervisor} onChange={handleChange} className="border px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block mb-1 font-medium">安全人員</label>
          <input name="safetyOfficer" value={form.safetyOfficer} onChange={handleChange} className="border px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block mb-1 font-medium">狀態</label>
          <input name="status" value={form.status} onChange={handleChange} className="border px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block mb-1 font-medium">優先</label>
          <input name="priority" value={form.priority} onChange={handleChange} className="border px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block mb-1 font-medium">區域</label>
          <input name="area" value={form.area} onChange={handleChange} className="border px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block mb-1 font-medium">地址</label>
          <input name="address" value={form.address} onChange={handleChange} className="border px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block mb-1 font-medium">工作區</label>
          <input name="workspace" value={form.workspace} onChange={handleChange} className="border px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block mb-1 font-medium">專案名稱（舊欄位）</label>
          <input name="name" value={form.name} onChange={handleChange} className="border px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block mb-1 font-medium">描述（舊欄位）</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="border px-2 py-1 w-full" rows={2} />
        </div>
        <button type="submit" className="bg-yellow-600 text-white px-4 py-2 rounded" disabled={saving}>
          {saving ? '儲存中...' : '儲存'}
        </button>
        {msg && <div className="mt-2 text-sm text-green-600">{msg}</div>}
      </form>
    </div>
  );
}
