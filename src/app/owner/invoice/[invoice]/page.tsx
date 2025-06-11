"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase, useDocument } from '@/hooks/useFirebase';
import type { InvoiceData, InvoiceItem } from '@/types/finance';
import { Timestamp } from 'firebase/firestore';

const InvoiceDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params?.invoice as string;
  const { db, doc, setDoc } = useFirebase();
  const [invoiceDoc, loading, error] = useDocument(invoiceId ? doc(db, 'finance', 'default', 'invoice', invoiceId) : undefined);
  const data = invoiceDoc?.exists() ? (invoiceDoc.data() as InvoiceData) : undefined;

  // 新增支出 modal 狀態
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseItems, setExpenseItems] = useState<InvoiceItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [expenseError, setExpenseError] = useState('');

  // 新增支出送出
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setExpenseError('');
    try {
      if (!expenseName || !expenseAmount || expenseItems.length === 0) throw new Error('請填寫完整支出資訊');
      const expenseId = `expense_${Date.now()}`;
      const invoiceData: InvoiceData = {
        invoiceId: expenseId,
        invoiceNumber: '',
        invoiceDate: Timestamp.now(),
        clientName: '',
        clientContact: '',
        clientPhone: '',
        clientEmail: '',
        projectId: '',
        invoiceName: expenseName,
        type: '支出',
        items: expenseItems,
        totalAmount: expenseAmount,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'draft',
        notes: '',
      };
      await setDoc(doc(db, 'finance', 'default', 'invoice', expenseId), invoiceData);
      setShowExpenseModal(false);
      setExpenseName('');
      setExpenseAmount(0);
      setExpenseItems([]);
      router.push(`/owner/invoice/${expenseId}`);
    } catch (err) {
      setExpenseError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  // 支出項目編輯元件（複用 create/page.tsx 寫法）
  const ExpenseItemsEditor: React.FC<{ items: InvoiceItem[]; setItems: (items: InvoiceItem[]) => void }> = ({ items, setItems }) => {
    const handleChange = (idx: number, key: keyof InvoiceItem, value: string | number) => {
      setItems(items.map((item, i) => i === idx ? { ...item, [key]: value, amount: (key === 'quantity' || key === 'unitPrice') ? Number(key === 'quantity' ? value : item.quantity) * Number(key === 'unitPrice' ? value : item.unitPrice) : item.amount } : item));
    };
    const addItem = () => setItems([...items, { invoiceItemId: String(Date.now()), description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
    const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
    return (
      <div>
        <table className="w-full border text-sm mb-2 border-gray-300 dark:border-gray-700">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">描述</th>
              <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">數量</th>
              <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">單價</th>
              <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">金額</th>
              <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.invoiceItemId}>
                <td className="border px-2 py-1 border-gray-300 dark:border-gray-700">
                  <input type="text" className="border px-2 py-1 rounded w-32 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700" value={item.description} onChange={e => handleChange(idx, 'description', e.target.value)} required />
                </td>
                <td className="border px-2 py-1 border-gray-300 dark:border-gray-700">
                  <input type="number" className="border px-2 py-1 rounded w-20 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700" min={1} value={item.quantity} onChange={e => handleChange(idx, 'quantity', Number(e.target.value))} required />
                </td>
                <td className="border px-2 py-1 border-gray-300 dark:border-gray-700">
                  <input type="number" className="border px-2 py-1 rounded w-24 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700" min={0} value={item.unitPrice} onChange={e => handleChange(idx, 'unitPrice', Number(e.target.value))} required />
                </td>
                <td className="border px-2 py-1 border-gray-300 dark:border-gray-700 text-right">{item.amount}</td>
                <td className="border px-2 py-1 border-gray-300 dark:border-gray-700 text-center">
                  {items.length > 1 && (
                    <button type="button" className="text-red-500 dark:text-red-400" onClick={() => removeItem(idx)}>刪除</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" className="bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-100 px-3 py-1 rounded mt-2" onClick={addItem}>新增項目</button>
      </div>
    );
  };

  return (
    <main className="p-6 bg-white dark:bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">發票詳情</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
          onClick={() => setShowExpenseModal(true)}
        >
          新增支出
        </button>
      </div>
      <div className="mb-2 text-gray-700 dark:text-gray-300">發票編號：{invoiceId}</div>
      {loading && <div className="text-gray-500 dark:text-gray-400">載入中...</div>}
      {error && <div className="text-red-500">載入失敗：{error.message}</div>}
      {!loading && data && (
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <div><span className="font-medium">發票名稱：</span>{data.invoiceName || '-'}</div>
            <div><span className="font-medium">類型：</span>{data.type}</div>
            {data.type === '請款' && (
              <>
                <div><span className="font-medium">關聯專案：</span>{data.projectId || '-'}</div>
                <div><span className="font-medium">金額：</span>{typeof data.totalAmount === 'number' ? data.totalAmount.toLocaleString() : '-'}</div>
              </>
            )}
            {data.type === '支出' && (
              <>
                <div><span className="font-medium">支出金額：</span>{typeof data.totalAmount === 'number' ? data.totalAmount.toLocaleString() : '-'}</div>
                <div>
                  <span className="font-medium">支出項目：</span>
                  <table className="min-w-full text-sm border mt-2">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="px-2 py-1 border">描述</th>
                        <th className="px-2 py-1 border">數量</th>
                        <th className="px-2 py-1 border">單價</th>
                        <th className="px-2 py-1 border">金額</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map(item => (
                        <tr key={item.invoiceItemId}>
                          <td className="px-2 py-1 border">{item.description}</td>
                          <td className="px-2 py-1 border text-right">{item.quantity}</td>
                          <td className="px-2 py-1 border text-right">{item.unitPrice}</td>
                          <td className="px-2 py-1 border text-right">{item.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <div><span className="font-medium">狀態：</span>{data.status}</div>
            <div><span className="font-medium">建立時間：</span>{data.createdAt?.toDate?.().toLocaleString?.() || '-'}</div>
            <div><span className="font-medium">備註：</span>{data.notes || '-'}</div>
          </div>
        </div>
      )}
      {!loading && !data && <div className="text-gray-500 dark:text-gray-400">找不到發票資料。</div>}

      {/* 新增支出 Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              onClick={() => setShowExpenseModal(false)}
              aria-label="關閉"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4">新增支出</h2>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              {expenseError && <div className="text-red-500 mb-2">{expenseError}</div>}
              <div>
                <label className="block font-medium mb-1 text-gray-900 dark:text-gray-100">支出名稱 <span className="text-red-500">*</span></label>
                <input type="text" className="w-full border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700" value={expenseName} onChange={e => setExpenseName(e.target.value)} required />
              </div>
              <div>
                <label className="block font-medium mb-1 text-gray-900 dark:text-gray-100">支出金額 <span className="text-red-500">*</span></label>
                <input type="number" className="w-full border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700" value={expenseAmount} onChange={e => setExpenseAmount(Number(e.target.value))} min={0} required />
              </div>
              <div>
                <label className="block font-medium mb-1 text-gray-900 dark:text-gray-100">支出項目 <span className="text-red-500">*</span></label>
                <ExpenseItemsEditor items={expenseItems} setItems={setExpenseItems} />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50" disabled={saving || !expenseName || !expenseAmount || expenseItems.length === 0}>
                  {saving ? '儲存中...' : '建立支出'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default InvoiceDetailPage;
