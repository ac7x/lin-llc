/**
 * 財務通用列表頁面
 * 
 * 動態顯示合約、訂單或報價單的列表。
 * - 根據 URL 的 'type' 參數決定顯示內容。
 * - 提供搜尋、排序和分頁功能。
 * - 支援 PDF 匯出。
 */

'use client';

import { doc, getDoc, collection, Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useState, useMemo } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';

import { ContractPdfDocument } from '@/components/pdf/ContractPdfDocument';
import { OrderPdfDocument } from '@/components/pdf/OrderPdfDocument';
import { generatePdfBlob } from '@/components/pdf/pdfUtils';
import { QuotePdfDocument } from '@/components/pdf/QuotePdfDocument';
import { db } from '@/lib/firebase-client';
import type { ContractData, OrderData, QuoteData } from '@/types/finance';
import { safeToDate } from '@/utils/dateUtils';

// 頁面設定檔
const pageConfig = {
  contracts: {
    title: '合約列表',
    collection: 'contracts',
    idField: 'contractId',
    nameField: 'contractName',
    priceField: 'contractPrice',
    pdfComponent: ContractPdfDocument,
  },
  orders: {
    title: '訂單列表',
    collection: 'orders',
    idField: 'orderId',
    nameField: 'orderName',
    priceField: 'orderPrice',
    pdfComponent: OrderPdfDocument,
  },
  quotes: {
    title: '報價單列表',
    collection: 'quotes',
    idField: 'quoteId',
    nameField: 'quoteName',
    priceField: 'quotePrice',
    pdfComponent: QuotePdfDocument,
  },
};

type FinanceType = keyof typeof pageConfig;
type DataRow = {
  idx: number;
  id: string;
  name: string;
  clientName: string;
  price: number | string;
  createdAt: Date | null;
  updatedAt: Date | null;
  daysAgo: number | string;
  docId: string;
};

export default function FinanceListPage() {
  const params = useParams();
  const type = params.type as FinanceType;
  const config = pageConfig[type] || pageConfig.contracts; // Fallback to contracts

  const [dataSnapshot, loading, error] = useCollection(
    collection(db, 'finance', 'default', config.collection)
  );

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string>('idx');
  const [sortAsc, setSortAsc] = useState(true);

  const rows: DataRow[] = useMemo(() => {
    if (!dataSnapshot) return [];

    const sortFns: Record<string, (a: DataRow, b: DataRow) => number> = {
      idx: (a, b) => a.idx - b.idx,
      name: (a, b) => (a.name || '').localeCompare(b.name || ''),
      clientName: (a, b) => (a.clientName || '').localeCompare(b.clientName || ''),
      price: (a, b) => (Number(a.price) || 0) - (Number(b.price) || 0),
      createdAt: (a, b) => (a.createdAt?.getTime?.() || 0) - (b.createdAt?.getTime?.() || 0),
      updatedAt: (a, b) => (a.updatedAt?.getTime?.() || 0) - (b.updatedAt?.getTime?.() || 0),
      daysAgo: (a, b) => (a.daysAgo === '-' ? -1 : Number(a.daysAgo)) - (b.daysAgo === '-' ? -1 : Number(b.daysAgo)),
    };

    let arr: DataRow[] = dataSnapshot.docs.map((item, idx) => {
      const data = item.data() as ContractData | OrderData | QuoteData;
      const createdAtDate = safeToDate(data.createdAt as Timestamp | Date);
      const daysAgo = createdAtDate
        ? Math.floor((Date.now() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24))
        : '-';
        
      return {
        idx: idx + 1,
        id: (data[config.idField as keyof typeof data] as string) || item.id,
        name: (data[config.nameField as keyof typeof data] as string) || item.id,
        clientName: data.clientName ?? '-',
        price: (data[config.priceField as keyof typeof data] as number) ?? '-',
        createdAt: createdAtDate,
        updatedAt: safeToDate(data.updatedAt as Timestamp | Date),
        daysAgo,
        docId: item.id,
      };
    });

    if (search.trim()) {
      const s = search.trim().toLowerCase();
      arr = arr.filter(
        (r) =>
          String(r.name).toLowerCase().includes(s) ||
          String(r.clientName).toLowerCase().includes(s)
      );
    }

    if (sortKey && sortFns[sortKey]) {
      arr.sort(sortFns[sortKey]);
      if (!sortAsc) arr.reverse();
    }

    return arr;
  }, [dataSnapshot, search, sortKey, sortAsc, config]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const handleExportPdf = async (row: DataRow) => {
    const docRef = doc(db, 'finance', 'default', config.collection, row.docId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      alert('找不到文件');
      return;
    }
    const data = docSnap.data();
    if (!data) return;

    const PdfComponent = config.pdfComponent;
    
    let pdfElement: React.ReactElement | null = null;
    switch(type) {
        case 'contracts':
            pdfElement = <ContractPdfDocument contract={data as ContractData} />;
            break;
        case 'orders':
            pdfElement = <OrderPdfDocument order={data as OrderData} />;
            break;
        case 'quotes':
            pdfElement = <QuotePdfDocument quote={data as QuoteData} />;
            break;
    }

    if(pdfElement) {
        generatePdfBlob(
            pdfElement,
            `${(data as any)[config.nameField] || (data as any)[config.idField] || '文件'}.pdf`
        );
    }
  };
  
  const getSortIcon = (key: string) => {
    if (sortKey !== key) return null;
    return sortAsc ? '▲' : '▼';
  };

  if (loading) {
    return (
      <main className='max-w-6xl mx-auto'>
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700'>
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className='max-w-6xl mx-auto'>
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700'>
        <div className='p-6 border-b border-gray-200 dark:border-gray-700'>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>{config.title}</h1>
        </div>
        <div className='p-6'>
          <div className='mb-6'>
            <input
              type='text'
              className='w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-colors duration-200'
              placeholder={`搜尋${config.title.slice(0,2)}名稱或客戶名稱`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='bg-gray-50 dark:bg-gray-700/50'>
                  {[
                    { key: 'idx', label: '序號' },
                    { key: 'name', label: `${config.title.slice(0,2)}名稱` },
                    { key: 'clientName', label: '客戶名稱' },
                    { key: 'price', label: '價格' },
                    { key: 'createdAt', label: '建立日期' },
                    { key: 'updatedAt', label: '修改日期' },
                    { key: 'daysAgo', label: '建立至今(天)' },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      className='px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer'
                      onClick={() => handleSort(key)}
                    >
                      {label} {getSortIcon(key)}
                    </th>
                  ))}
                  <th className='px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400'>
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                 {error ? (
                  <tr>
                    <td colSpan={8} className='px-4 py-8 text-center text-red-500'>
                      {String(error)}
                    </td>
                  </tr>
                ) : rows.length > 0 ? (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      className='hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200'
                    >
                      <td className='px-4 py-3 text-gray-900 dark:text-gray-100'>{row.idx}</td>
                      <td className='px-4 py-3 text-gray-900 dark:text-gray-100'>{row.name}</td>
                      <td className='px-4 py-3 text-gray-900 dark:text-gray-100'>{row.clientName}</td>
                      <td className='px-4 py-3 text-gray-900 dark:text-gray-100'>{row.price}</td>
                      <td className='px-4 py-3 text-gray-900 dark:text-gray-100'>{row.createdAt?.toLocaleDateString() || '-'}</td>
                      <td className='px-4 py-3 text-gray-900 dark:text-gray-100'>{row.updatedAt?.toLocaleDateString() || '-'}</td>
                      <td className='px-4 py-3 text-gray-900 dark:text-gray-100'>{row.daysAgo}</td>
                      <td className='px-4 py-3'>
                        <div className='flex items-center gap-3'>
                          <Link
                            href={`/finance/${type}/${row.id}`}
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
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className='px-4 py-8 text-center text-gray-500 dark:text-gray-400'>
                      尚無資料
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
} 