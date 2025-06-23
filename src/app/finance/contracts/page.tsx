'use client';

import Link from 'next/link';
import { DocumentData, Timestamp } from 'firebase/firestore';

import { FinanceListPage, Column } from '@/app/finance/components/FinanceListPage';
import { generatePdfBlob } from '@/components/pdf/pdfUtils';
import { ContractPdfDocument } from '@/components/pdf/ContractPdfDocument';
import { ContractData } from '@/types/finance';
import { safeToDate } from '@/utils/dateUtils';

export type ContractRow = Omit<ContractData, 'createdAt' | 'updatedAt'> & {
  createdAt: Date | null;
  updatedAt: Date | null;
  idx: number;
  docId: string;
  daysAgo: number | string;
};

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
    idx: 0, // Will be overridden by FinanceListPage
    docId: '', // Will be overridden by FinanceListPage
  };
};

const handleExportPdf = async (row: ContractRow) => {
  generatePdfBlob(
    <ContractPdfDocument contract={row} />,
    `${row.contractName || row.contractId || '合約'}.pdf`
  );
};

const columns: Column<ContractRow>[] = [
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
    render: (row) => (
      <div className='flex items-center gap-3'>
        <Link
          href={`/finance/contracts/${row.docId}`}
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

export default function ContractsPage() {
  return (
    <FinanceListPage<ContractRow>
      title="合約列表"
      collectionName="contracts"
      columns={columns}
      basePath="/finance/contracts"
      idField="contractId"
      nameField="contractName"
      clientField="clientName"
      processData={processContractData}
    />
  );
}
