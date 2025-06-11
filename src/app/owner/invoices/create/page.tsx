"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useCollection, useDocument } from '@/hooks/useFirebase';
import { Timestamp } from 'firebase/firestore';
import type { Project } from '@/types/project';
import type { InvoiceData } from '@/types/finance';

const InvoiceCreatePage: React.FC = () => {
  const router = useRouter();
  const { db, collection, doc, setDoc } = useFirebase();
  const [projectsSnapshot] = useCollection(collection(db, 'projects'));
  const [invoicesSnapshot] = useCollection(collection(db, 'finance', 'default', 'invoice'));
  const [projectId, setProjectId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // 僅保留請款
  // ...existing code...

  // 監聽所選專案的 workpackages
  const [projectDoc] = useDocument(projectId ? doc(db, 'projects', projectId) : undefined);
  const workpackages = useMemo(() => {
    if (!projectDoc?.exists()) return [];
    const data = projectDoc.data() as Project;
    return Array.isArray(data.workpackages) ? data.workpackages : [];
  }, [projectDoc]);

  // 加總所有 workpackages 的預算
  const totalBudget = useMemo(() => {
    return workpackages.reduce((sum, wp) => sum + (typeof wp.budget === 'number' ? wp.budget : 0), 0);
  }, [workpackages]);

  // 取得所有已建立的發票 projectId
  const existingProjectIds = invoicesSnapshot?.docs.map(doc => (doc.data() as InvoiceData).projectId) ?? [];

  // 取得所選專案名稱
  const selectedProjectName = useMemo(() => {
    if (!projectId || !projectsSnapshot) return '';
    const docSnap = projectsSnapshot.docs.find(doc => doc.id === projectId);
    if (!docSnap) return '';
    const data = docSnap.data() as Project;
    return data.projectName || docSnap.id;
  }, [projectId, projectsSnapshot]);

  // 建立發票
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      // 僅保留請款
      if (!projectId) throw new Error('請選擇專案');
      const invoiceData: InvoiceData = {
        invoiceId: projectId,
        invoiceNumber: '',
        invoiceDate: Timestamp.now(),
        clientName: '',
        clientContact: '',
        clientPhone: '',
        clientEmail: '',
        projectId,
        invoiceName: selectedProjectName,
        type: '請款',
        items: [],
        totalAmount: totalBudget,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'draft',
        notes: '',
      };
      await setDoc(doc(db, 'finance', 'default', 'invoice', projectId), invoiceData);
      router.push('/owner/invoice');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">新增發票</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-900 rounded shadow p-6">
        {error && <div className="text-red-500 mb-2">{error}</div>}
        {/* 僅顯示請款選項 */}
        <div className="flex gap-4 mb-2">
          <label className="font-medium text-gray-900 dark:text-gray-100">
            <input type="radio" value="請款" checked readOnly className="mr-1" />請款
          </label>
        </div>
        {/* 請款表單 */}
        <div>
          <label className="block font-medium mb-1 text-gray-900 dark:text-gray-100">選擇專案 <span className="text-red-500">*</span></label>
          <select
            className="w-full border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500"
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            required
          >
            <option value="">請選擇</option>
            {projectsSnapshot?.docs
              .filter(doc => !existingProjectIds.includes(doc.id))
              .map(doc => {
                const data = doc.data() as Project;
                return <option key={doc.id} value={doc.id}>{data.projectName || doc.id}</option>;
              })}
          </select>
        </div>
        {projectId && (
          <div className="flex flex-col gap-2">
            <div className="text-gray-900 dark:text-gray-100 font-medium">專案總預算：<span className="font-bold">{totalBudget.toLocaleString()}</span></div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border mt-2">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="px-2 py-1 border">工作包名稱</th>
                    <th className="px-2 py-1 border">預算</th>
                  </tr>
                </thead>
                <tbody>
                  {workpackages.map(wp => (
                    <tr key={wp.id}>
                      <td className="px-2 py-1 border">{wp.name}</td>
                      <td className="px-2 py-1 border text-right">{typeof wp.budget === 'number' ? wp.budget.toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50" disabled={saving || !projectId}>
            {saving ? '儲存中...' : '建立發票'}
          </button>
        </div>
      </form>
    </main>
  );
};

export default InvoiceCreatePage;
