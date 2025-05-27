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

  const [form, setForm] = useState({ name: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const snap = await getDoc(projectRef);
      if (snap.exists()) {
        setForm({ name: snap.data().name || '' });
      }
      setLoading(false);
    }
    fetchData();
  }, [projectId, projectRef]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await updateDoc(projectRef, { name: form.name });
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
          <label className="block mb-1 font-medium">專案名稱</label>
          <input
            className="border px-2 py-1 w-full"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
            disabled={saving}
          />
        </div>
        <button type="submit" className="bg-yellow-600 text-white px-4 py-2 rounded" disabled={saving}>
          {saving ? '儲存中...' : '儲存'}
        </button>
        {msg && <div className="mt-2 text-sm text-green-600">{msg}</div>}
      </form>
    </div>
  );
}
