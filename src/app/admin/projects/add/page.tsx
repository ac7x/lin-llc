"use client";

import { useState } from 'react';
import { app } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function AddProjectPage() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const db = getFirestore(app);
  const projectsRef = collection(db, 'projects');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      await addDoc(projectsRef, {
        name,
        createdAt: Timestamp.now(),
      });
      setMessage('專案建立成功');
      setName('');
      setTimeout(() => router.push('/admin/projects'), 800);
    } catch (err: unknown) {
      let errorMsg = '建立失敗: 未知錯誤';
      if (err instanceof Error) {
        errorMsg = '建立失敗: ' + err.message;
      }
      setMessage(errorMsg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">新增專案</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">專案名稱</label>
          <input
            className="border px-2 py-1 w-full"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            disabled={saving}
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={saving}>
          {saving ? '建立中...' : '建立專案'}
        </button>
        {message && <div className="mt-2 text-sm text-green-600">{message}</div>}
      </form>
    </div>
  );
}
