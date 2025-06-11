"use client";

import React from 'react';
import { useParams } from 'next/navigation';

const InvoiceDetailPage: React.FC = () => {
  const params = useParams();
  const invoiceId = params?.invoice as string;

  return (
    <main className="p-6 bg-white dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">發票詳情</h1>
      <div className="mb-2 text-gray-700 dark:text-gray-300">發票編號：{invoiceId}</div>
      {/* 這裡將來可放置發票詳細資料 */}
      <div className="text-gray-500 dark:text-gray-400">發票詳細資料開發中。</div>
    </main>
  );
};

export default InvoiceDetailPage;
