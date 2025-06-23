'use client';

import { DocumentData } from 'firebase/firestore';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ReactElement } from 'react';

import {
  FinanceListPage,
  Column,
} from '@/app/finance/components/FinanceListPage';
import { ContractPdfDocument } from '@/components/pdf/ContractPdfDocument';
import { OrderPdfDocument } from '@/components/pdf/OrderPdfDocument';
import { generatePdfBlob } from '@/components/pdf/pdfUtils';
import { QuotePdfDocument } from '@/components/pdf/QuotePdfDocument';
import {
  ContractData,
  OrderData,
  QuoteData,
  ContractRow,
  OrderRow,
  QuoteRow,
} from '@/types/finance';
import { safeToDate } from '@/utils/dateUtils';

// #region Type Definitions
// #endregion

// #region Process Data Functions
const processContractData = (data: DocumentData): ContractRow => {
  const contractData = data as ContractData;
  const createdAtDate = safeToDate(contractData.createdAt);
  const daysAgo = createdAtDate
    ? Math.floor((Date.now() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24))
    : '-';
  return {
    ...contractData,
    contractId: contractData.contractId || '',
    contractName: contractData.contractName || contractData.contractId || '',
    clientName: contractData.clientName ?? '-',
    contractPrice: contractData.contractPrice ?? 0,
    createdAt: createdAtDate,
    updatedAt: safeToDate(contractData.updatedAt),
    daysAgo,
    idx: 0,
    docId: '',
  };
};

const processOrderData = (data: DocumentData): OrderRow => {
  const orderData = data as OrderData;
  const createdAtDate = safeToDate(orderData.createdAt);
  const daysAgo = createdAtDate
    ? Math.floor((Date.now() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24))
    : '-';
  return {
    ...orderData,
    orderId: orderData.orderId || '',
    orderName: orderData.orderName || orderData.orderId || '',
    clientName: orderData.clientName ?? '-',
    orderPrice: orderData.orderPrice ?? 0,
    createdAt: createdAtDate,
    updatedAt: safeToDate(orderData.updatedAt),
    daysAgo,
    idx: 0,
    docId: '',
  };
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
    idx: 0,
    docId: '',
  };
};
// #endregion

// #region Column Definitions
const getContractColumns = (basePath: string): Column<ContractRow>[] => [
  { key: 'idx', label: '序號', sortable: true },
  { key: 'contractName', label: '合約名稱', sortable: true },
  { key: 'clientName', label: '客戶名稱', sortable: true },
  { key: 'contractPrice', label: '價格', sortable: true },
  { key: 'createdAt', label: '建立日期', sortable: true },
  { key: 'updatedAt', label: '修改日期', sortable: true },
  { key: 'daysAgo', label: '建立至今(天)', sortable: true },
  {
    key: 'actions',
    label: '操作',
    render: row => (
      <div className='flex items-center gap-3'>
        <Link
          href={`${basePath}/${row.docId}`}
          className='text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium'
        >
          查看
        </Link>
        <button
          className='text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium'
          onClick={() =>
            generatePdfBlob(
              <ContractPdfDocument contract={row} />,
              `${row.contractName || row.contractId || '合約'}.pdf`
            )
          }
        >
          匯出PDF
        </button>
      </div>
    ),
  },
];

const getOrderColumns = (basePath: string): Column<OrderRow>[] => [
  { key: 'idx', label: '序號', sortable: true },
  { key: 'orderName', label: '訂單名稱', sortable: true },
  { key: 'clientName', label: '客戶名稱', sortable: true },
  { key: 'orderPrice', label: '價格', sortable: true },
  { key: 'createdAt', label: '建立日期', sortable: true },
  { key: 'updatedAt', label: '修改日期', sortable: true },
  { key: 'daysAgo', label: '建立至今(天)', sortable: true },
  {
    key: 'actions',
    label: '操作',
    render: row => (
      <div className='flex items-center gap-3'>
        <Link
          href={`${basePath}/${row.docId}`}
          className='text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium'
        >
          查看
        </Link>
        <button
          className='text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium'
          onClick={() =>
            generatePdfBlob(
              <OrderPdfDocument order={row} />,
              `${row.orderName || row.orderId || '訂單'}.pdf`
            )
          }
        >
          匯出PDF
        </button>
      </div>
    ),
  },
];

const getQuoteColumns = (basePath: string): Column<QuoteRow>[] => [
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
    render: row => (
      <div className='flex items-center gap-3'>
        <Link
          href={`${basePath}/${row.docId}`}
          className='text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium'
        >
          查看
        </Link>
        <button
          className='text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium'
          onClick={() =>
            generatePdfBlob(
              <QuotePdfDocument quote={row} />,
              `${row.quoteName || row.quoteId || '報價單'}.pdf`
            )
          }
        >
          匯出PDF
        </button>
      </div>
    ),
  },
];
// #endregion

type FinanceType = 'contracts' | 'orders' | 'quotes';

const financeConfig: Record<
  FinanceType,
  {
    component: ReactElement;
  }
> = {
  contracts: {
    component: (
      <FinanceListPage<ContractRow>
        title='合約列表'
        collectionName='contracts'
        columns={getContractColumns('/finance/contracts')}
        nameField='contractName'
        clientField='clientName'
        processData={processContractData}
      />
    ),
  },
  orders: {
    component: (
      <FinanceListPage<OrderRow>
        title='訂單列表'
        collectionName='orders'
        columns={getOrderColumns('/finance/orders')}
        nameField='orderName'
        clientField='clientName'
        processData={processOrderData}
      />
    ),
  },
  quotes: {
    component: (
      <FinanceListPage<QuoteRow>
        title='報價單列表'
        collectionName='quotes'
        columns={getQuoteColumns('/finance/quotes')}
        nameField='quoteName'
        clientField='clientName'
        processData={processQuoteData}
      />
    ),
  },
};

export default function FinanceTypePage() {
  const params = useParams();
  const type = params.type as FinanceType;

  if (!financeConfig[type]) {
    return (
      <div className='flex h-full w-full items-center justify-center'>
        <p className='text-red-500'>無效的財務類型: {type}</p>
      </div>
    );
  }

  return financeConfig[type].component;
} 