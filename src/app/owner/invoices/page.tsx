"use client";

import React, { useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { InvoicePdfDocument } from '@/components/pdf/InvoicePdfDocument';
import { exportPdfToBlob } from '@/components/pdf/pdfExport';
import QRCode from 'qrcode';
import type { InvoiceData } from '@/types/finance';
import { db } from '@/lib/firebase-client';
import { collection } from 'firebase/firestore';

const InvoicePage: React.FC = () => {
  const { user } = useAuth();
  const [invoicesSnapshot, loading, error] = useCollection(collection(db, 'finance', 'default', 'invoice'));

  // PDF 匯出功能
  const handleExportPdf = useCallback(async (data: InvoiceData, id: string) => {
    try {
      // 產生 QR code（連結到發票詳情頁）
      const qrCodeDataUrl = await QRCode.toDataURL(`${window.location.origin}/owner/invoices/${id}`);
      
      // 轉換為 Record<string, unknown>
      const invoice: Record<string, unknown> = {
        ...data,
        expenses: Array.isArray(data.expenses) ? data.expenses : []
      };
      
      // 匯出 PDF
      await exportPdfToBlob(
        <InvoicePdfDocument 
          invoice={invoice}
          qrCodeDataUrl={qrCodeDataUrl}
        />,
        `invoice_${data.invoiceName || id}_${new Date().toISOString().split('T')[0]}.pdf`
      );
    } catch (err) {
      console.error('匯出 PDF 失敗:', err);
      alert('匯出 PDF 失敗');
    }
  }, []);

  return (
    <main className="p-6 bg-white dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">發票管理</h1>
      <div className="mb-4">
        <Link href="/owner/invoice/create" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline">
          新增發票
        </Link>
      </div>
      {error && <div className="text-red-500">載入發票失敗：{error.message}</div>}
      {loading && <div className="text-gray-500 dark:text-gray-400">載入中...</div>}
      {!loading && invoicesSnapshot && invoicesSnapshot.size > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border mt-2">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="px-2 py-1 border">發票名稱</th>
                <th className="px-2 py-1 border">金額</th>
                <th className="px-2 py-1 border">支出</th>
                <th className="px-2 py-1 border">狀態</th>
                <th className="px-2 py-1 border">操作</th>
              </tr>
            </thead>
            <tbody>
              {invoicesSnapshot.docs.map(doc => {
                const data = doc.data() as InvoiceData;
                // 計算 expenses 的 amount 總和
                const expensesTotal = Array.isArray(data.expenses)
                  ? data.expenses.reduce((sum, exp) => sum + (typeof exp.amount === 'number' ? exp.amount : 0), 0)
                  : 0;
                return (
                  <tr key={doc.id}>
                    <td className="px-2 py-1 border">{data.invoiceName || '-'}</td>
                    <td className="px-2 py-1 border text-right">{typeof data.totalAmount === 'number' ? data.totalAmount.toLocaleString() : '-'}</td>
                    <td className="px-2 py-1 border text-right">
                      {expensesTotal > 0 ? expensesTotal.toLocaleString() : '-'}
                    </td>
                    <td className="px-2 py-1 border">{data.status}</td>
                    <td className="px-2 py-1 border">
                      <div className="flex gap-2 justify-center">
                        <Link href={`/owner/invoices/${doc.id}`} className="text-blue-600 hover:underline">
                          檢視
                        </Link>
                        <button
                          onClick={() => handleExportPdf(data, doc.id)}
                          className="text-green-600 hover:underline"
                        >
                          匯出PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : !loading && (
        <div className="text-gray-500 dark:text-gray-400">尚無發票資料。</div>
      )}
    </main>
  );
};

export default InvoicePage;
