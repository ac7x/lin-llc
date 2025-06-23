/**
 * 報價單列表頁面
 *
 * 顯示所有報價單的列表，提供以下功能：
 * - 報價單搜尋
 * - 多欄位排序
 * - PDF 匯出
 * - 報價單詳細資訊查看
 * - 報價單狀態追蹤
 */

'use client';

import Link from 'next/link';
import { DocumentData, Timestamp } from 'firebase/firestore';

import { FinanceListPage, Column } from '@/components/finance/FinanceListPage';
import { generatePdfBlob } from '@/components/pdf/pdfUtils';
import { QuotePdfDocument } from '@/components/pdf/QuotePdfDocument';
import { QuoteData } from '@/types/finance';
import { safeToDate } from '@/utils/dateUtils';

export type QuoteRow = Omit<QuoteData, 'createdAt' | 'updatedAt'> & {
  createdAt: Date | null;
  updatedAt: Date | null;
  idx: number;
  docId: string;
  daysAgo: number | string;
};

const processQuoteData = (data: DocumentData): QuoteRow => {
  const quoteData = data as QuoteData;
  const createdAtDate = safeToDate(quoteData.createdAt);
  const daysAgo = createdAtDate
    ? Math.floor((Date.now() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24))
    : '-';
  return {
    ...quoteData,
    quoteId: quoteData.quoteId || '',
    quoteName: quoteData.quoteName || quoteData.quoteId || '',
    clientName: quoteData.clientName ?? '-',
    quotePrice: quoteData.quotePrice ?? 0,
    createdAt: createdAtDate,
    updatedAt: safeToDate(quoteData.updatedAt),
    daysAgo,
    idx: 0, // Will be overridden
    docId: '', // Will be overridden
  };
};

const handleExportPdf = async (row: QuoteRow) => {
  generatePdfBlob(
    <QuotePdfDocument quote={row} />,
    `${row.quoteName || row.quoteId || '報價單'}.pdf`
  );
};

const columns: Column<QuoteRow>[] = [
  { key: 'idx', label: '序號', sortable: true },
  { key: 'quoteName', label: '報價單名稱', sortable: true },
  { key: 'clientName', label: '客戶名稱', sortable: true },
  { key: 'quotePrice', label: '價格', sortable: true },
  { key: 'createdAt', label: '建立日期', sortable: true },
  { key: 'updatedAt', label: '修改日期', sortable: true },
  { key: 'daysAgo', label: '建立至今(天)', sortable: true },
  {
    key: 'actions',
    label: '操作',
    render: (row) => (
      <div className='flex items-center gap-3'>
        <Link
          href={`/finance/quotes/${row.docId}`}
          className='text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium'
        >
          查看
        </Link>
        <button
          className='text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium'
          onClick={() => handleExportPdf(row)}
        >
          匯出PDF
        </button>
      </div>
    ),
  },
];

export default function QuotesPage() {
  return (
    <FinanceListPage<QuoteRow>
      title="報價單列表"
      collectionName="quotes"
      columns={columns}
      basePath="/finance/quotes"
      idField="quoteId"
      nameField="quoteName"
      clientField="clientName"
      processData={processQuoteData}
    />
  );
}
