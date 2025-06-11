"use client";

import { useState, useEffect } from 'react';
import { useFirebase, useCollection } from '@/hooks/useFirebase';
import type { InvoiceData } from '@/types/finance';

export default function ArchivedInvoicePage() {
  const { db, collection, doc, getDoc } = useFirebase();
  const [archiveRetentionDays, setArchiveRetentionDays] = useState<number>(3650);
  useEffect(() => {
    async function fetchRetentionDays() {
      const docRef = doc(db, 'settings', 'archive');
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setArchiveRetentionDays(typeof data.retentionDays === 'number' ? data.retentionDays : 3650);
      }
    }
    fetchRetentionDays();
  }, [db, doc, getDoc]);

  // 取得封存發票
  // 假設 userId 目前為 "default"，可根據登入狀態調整
  const [invoicesSnapshot, loading, error] = useCollection(collection(db, 'archived/default/invoice'));

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* 封存自動刪除提示 */}
      <div className="mb-4 p-3 rounded bg-yellow-100 text-yellow-800 border border-yellow-300 text-sm dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-700">
        封存文件將於 {archiveRetentionDays} 天（約 {Math.round(archiveRetentionDays / 365)} 年）後自動刪除。
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-gray-100">封存發票</h1>
      </div>
      <table className="w-full border text-sm dark:border-gray-700">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            <th className="border px-2 py-1 dark:border-gray-700 dark:text-gray-100">序號</th>
            <th className="border px-2 py-1 dark:border-gray-700 dark:text-gray-100">發票名稱</th>
            <th className="border px-2 py-1 dark:border-gray-700 dark:text-gray-100">金額</th>
            <th className="border px-2 py-1 dark:border-gray-700 dark:text-gray-100">封存日期</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={4} className="text-center py-4 dark:text-gray-300">載入中...</td></tr>
          ) : error ? (
            <tr><td colSpan={4} className="text-center text-red-500 py-4 dark:text-red-400">{String(error)}</td></tr>
          ) : invoicesSnapshot && invoicesSnapshot.docs.length > 0 ? (
            invoicesSnapshot.docs.map((invoice, idx) => {
              const data = invoice.data() as InvoiceData & { archivedAt?: { toDate: () => Date } };
              const archivedAt = data.archivedAt?.toDate?.();
              return (
                <tr key={data.invoiceId || invoice.id}>
                  <td className="border px-2 py-1 text-center dark:border-gray-700 dark:text-gray-100">{idx + 1}</td>
                  <td className="border px-2 py-1 dark:border-gray-700 dark:text-gray-100">{data.invoiceName || invoice.id}</td>
                  <td className="border px-2 py-1 dark:border-gray-700 dark:text-gray-100 text-right">{typeof data.totalAmount === 'number' ? data.totalAmount.toLocaleString() : '-'}</td>
                  <td className="border px-2 py-1 dark:border-gray-700 dark:text-gray-100">{archivedAt ? archivedAt.toLocaleString() : '-'}</td>
                </tr>
              );
            })
          ) : (
            <tr><td colSpan={4} className="text-center py-4 dark:text-gray-300">尚無封存發票</td></tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
