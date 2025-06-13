"use client";

import React, { useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDocument, useCollection } from 'react-firebase-hooks/firestore';
import QRCode from 'qrcode';
import { InvoicePdfDocument } from '@/components/pdf/InvoicePdfDocument';
import { exportPdfToBlob } from '@/components/pdf/pdfExport';
import type { InvoiceData, Expense, InvoiceItem } from '@/types/finance';
import type { Project } from '@/types/project';
import { Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { doc, updateDoc, arrayUnion, collection } from 'firebase/firestore';

const InvoiceDetailPage: React.FC = () => {
  const params = useParams();
  const invoiceId = params?.invoice as string;
  const { user } = useAuth();
  const [invoiceDoc, loading, error] = useDocument(invoiceId ? doc(db, 'finance', 'default', 'invoice', invoiceId) : undefined);
  const data = invoiceDoc?.exists() ? (invoiceDoc.data() as InvoiceData) : undefined;

  // 取得所有 projects 與 workpackages
  const [projectsSnapshot] = useCollection(collection(db, 'projects'));

  // 支出 modal 狀態
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseName, setExpenseName] = useState('');
  const [expenseItems, setExpenseItems] = useState<InvoiceItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [expenseError, setExpenseError] = useState('');
  // 新增：支出應用 workpackage
  const [expenseWorkpackageId, setExpenseWorkpackageId] = useState<string>('');

  // 自動計算支出金額
  const expenseAmount = expenseItems.reduce((sum, item) => sum + (typeof item.amount === 'number' ? item.amount : 0), 0);

  // 新增支出送出
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setExpenseError('');
    try {
      if (!expenseName || expenseItems.length === 0) throw new Error('請填寫完整支出資訊');
      if (!invoiceId) throw new Error('找不到發票 ID');
      if (expenseAmount <= 0) throw new Error('支出金額需大於 0');
      if (!expenseWorkpackageId) throw new Error('請選擇支出應用的工作包');
      const expenseId = `expense_${Date.now()}`;
      const expense = {
        expenseId,
        expenseName,
        amount: expenseAmount,
        items: expenseItems,
        createdAt: Timestamp.now(),
        workpackageId: expenseWorkpackageId,
      };
      await updateDoc(doc(db, 'finance', 'default', 'invoice', invoiceId), {
        expenses: arrayUnion(expense),
        updatedAt: Timestamp.now(),
      });
      setShowExpenseModal(false);
      setExpenseName('');
      setExpenseItems([]);
      setExpenseWorkpackageId('');
    } catch (err) {
      setExpenseError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  // 支出項目編輯元件（複用 create/page.tsx 寫法）
  const ExpenseItemsEditor: React.FC<{ items: InvoiceItem[]; setItems: (items: InvoiceItem[]) => void }> = ({ items, setItems }) => {
    // 本地暫存 input 狀態
    const [localItems, setLocalItems] = useState(() =>
      items.length > 0
        ? items.map(item => ({
            ...item,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
          }))
        : [{
            invoiceItemId: String(Date.now()),
            description: '',
            quantity: '1',
            unitPrice: '0',
            amount: 0,
          }]
    );

    // 使用 useRef 來存儲防抖定時器
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    // 處理 input 變更，使用防抖優化
    const handleChange = useCallback((idx: number, key: keyof InvoiceItem, value: string) => {
      // 立即更新本地狀態以保持輸入響應性
      setLocalItems(prev => {
        const newItems = prev.map((item, i) => {
          if (i !== idx) return item;
          
          const updatedItem = { ...item, [key]: value };
          
          if (key === 'quantity' || key === 'unitPrice') {
            const quantity = key === 'quantity' ? value : item.quantity;
            const unitPrice = key === 'unitPrice' ? value : item.unitPrice;
            updatedItem.amount = Number(quantity) * Number(unitPrice);
          }
          
          return updatedItem;
        });

        // 使用防抖更新父組件狀態
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
          setItems(newItems.map(item => ({
            ...item,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            amount: Number(item.quantity) * Number(item.unitPrice),
          })));
        }, 300); // 300ms 的防抖延遲

        return newItems;
      });
    }, [setItems]);

    // 清理防抖定時器
    React.useEffect(() => {
      return () => {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
      };
    }, []);

    // 新增項目
    const addItem = useCallback(() => {
      const newItem = {
        invoiceItemId: String(Date.now()),
        description: '',
        quantity: '1',
        unitPrice: '0',
        amount: 0,
      };
      
      setLocalItems(prev => [...prev, newItem]);
      setItems([...items, {
        ...newItem,
        quantity: 1,
        unitPrice: 0,
        amount: 0,
      }]);
    }, [items, setItems]);

    // 移除項目
    const removeItem = useCallback((idx: number) => {
      setLocalItems(prev => {
        const newItems = prev.filter((_, i) => i !== idx);
        setItems(newItems.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          amount: Number(item.quantity) * Number(item.unitPrice),
        })));
        return newItems;
      });
    }, [setItems]);

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
            {localItems.map((item, idx) => (
              <tr key={item.invoiceItemId}>
                <td className="border px-2 py-1 border-gray-300 dark:border-gray-700">
                  <input
                    type="text"
                    className="border px-2 py-1 rounded w-32 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700"
                    value={item.description}
                    onChange={e => handleChange(idx, 'description', e.target.value)}
                    required
                  />
                </td>
                <td className="border px-2 py-1 border-gray-300 dark:border-gray-700">
                  <input
                    type="number"
                    className="border px-2 py-1 rounded w-20 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700"
                    min={1}
                    value={item.quantity}
                    onChange={e => handleChange(idx, 'quantity', e.target.value)}
                    required
                    inputMode="numeric"
                  />
                </td>
                <td className="border px-2 py-1 border-gray-300 dark:border-gray-700">
                  <input
                    type="number"
                    className="border px-2 py-1 rounded w-24 bg-white dark:bg-gray-800 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700"
                    min={0}
                    value={item.unitPrice}
                    onChange={e => handleChange(idx, 'unitPrice', e.target.value)}
                    required
                    inputMode="decimal"
                  />
                </td>
                <td className="border px-2 py-1 border-gray-300 dark:border-gray-700 text-right">
                  {item.amount.toLocaleString()}
                </td>
                <td className="border px-2 py-1 border-gray-300 dark:border-gray-700 text-center">
                  {localItems.length > 1 && (
                    <button type="button" className="text-red-500 dark:text-red-400" onClick={() => removeItem(idx)}>
                      刪除
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          type="button"
          className="bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-100 px-3 py-1 rounded mt-2"
          onClick={addItem}
        >
          新增項目
        </button>
      </div>
    );
  };

  // 取得所有 workpackages（展平成一個陣列）
  const allWorkpackages = React.useMemo(() => {
    if (!projectsSnapshot) return [];
    const arr: { id: string; name: string; projectName: string }[] = [];
    projectsSnapshot.docs.forEach(docSnap => {
      const project = docSnap.data() as Project;
      if (Array.isArray(project.workpackages)) {
        project.workpackages.forEach(wp => {
          arr.push({
            id: wp.id,
            name: wp.name,
            projectName: project.projectName || docSnap.id,
          });
        });
      }
    });
    return arr;
  }, [projectsSnapshot]);

  // 處理 PDF 匯出
  const handleExportPdf = useCallback(async () => {
    if (!data) return;
    try {
      // 產生 QR code
      const qrCodeDataUrl = await QRCode.toDataURL(window.location.href);
      
      // 把 InvoiceData 轉換為 Record<string, unknown>
      const invoice: Record<string, unknown> = {
        ...data,
        expenses: Array.isArray(data.expenses) ? data.expenses : []
      };
      
      // 產生 PDF
      await exportPdfToBlob(
        <InvoicePdfDocument
          invoice={invoice}
          qrCodeDataUrl={qrCodeDataUrl}
        />,
        `invoice_${data.invoiceName || invoiceId}_${new Date().toISOString().split('T')[0]}.pdf`
      );
    } catch (err) {
      console.error('匯出 PDF 失敗:', err);
    }
  }, [data, invoiceId]);

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
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.invoiceName || '未命名發票'}</h1>
            <button
              onClick={handleExportPdf}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              匯出 PDF
            </button>
          </div>
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
            {Array.isArray(data.expenses) && data.expenses.length > 0 && (
              <div>
                <span className="font-medium">支出紀錄：</span>
                <table className="min-w-full text-sm border mt-2">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <th className="px-2 py-1 border">支出名稱</th>
                      <th className="px-2 py-1 border">金額</th>
                      <th className="px-2 py-1 border">建立時間</th>
                      <th className="px-2 py-1 border">項目明細</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.expenses.map((exp: Expense) => (
                      <tr key={exp.expenseId}>
                        <td className="px-2 py-1 border">{exp.expenseName}</td>
                        <td className="px-2 py-1 border text-right">{typeof exp.amount === 'number' ? exp.amount.toLocaleString() : '-'}</td>
                        <td className="px-2 py-1 border">{exp.createdAt?.toDate?.().toLocaleString?.() || '-'}</td>
                        <td className="px-2 py-1 border">
                          <ul className="list-disc pl-4">
                            {Array.isArray(exp.items) && exp.items.map((item: InvoiceItem) => (
                              <li key={item.invoiceItemId}>
                                {item.description ? item.description : '-'}
                                （{item.quantity} × {item.unitPrice.toLocaleString()} = {item.amount.toLocaleString()}）
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
              {/* 新增：支出應用的工作包選單 */}
              <div>
                <label className="block font-medium mb-1 text-gray-900 dark:text-gray-100">支出應用工作包 <span className="text-red-500">*</span></label>
                <select
                  className="w-full border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                  value={expenseWorkpackageId}
                  onChange={e => setExpenseWorkpackageId(e.target.value)}
                  required
                >
                  <option value="">請選擇</option>
                  {allWorkpackages.map(wp => (
                    <option key={wp.id} value={wp.id}>
                      {wp.projectName} - {wp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1 text-gray-900 dark:text-gray-100">支出名稱 <span className="text-red-500">*</span></label>
                <input type="text" className="w-full border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700" value={expenseName} onChange={e => setExpenseName(e.target.value)} required />
              </div>
              {/* 移除可編輯的支出金額欄位，改為顯示自動加總 */}
              <div>
                <label className="block font-medium mb-1 text-gray-900 dark:text-gray-100">支出金額 <span className="text-red-500">*</span></label>
                <div className="w-full border rounded px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700">
                  {expenseAmount.toLocaleString()} 元
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1 text-gray-900 dark:text-gray-100">支出項目 <span className="text-red-500">*</span></label>
                <ExpenseItemsEditor items={expenseItems} setItems={setExpenseItems} />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50" disabled={saving || !expenseName || expenseAmount <= 0 || expenseItems.length === 0 || !expenseWorkpackageId}>
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
