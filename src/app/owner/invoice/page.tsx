import React from 'react';
import Link from 'next/link';

const InvoicePage: React.FC = () => {
  return (
    <main className="p-6 bg-white dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">發票管理</h1>
      <div className="mb-4">
        <Link href="/owner/invoice/create" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline">
          新增發票
        </Link>
      </div>
      {/* 這裡將來可放置發票列表 */}
      <div className="text-gray-500 dark:text-gray-400">尚無發票資料。</div>
    </main>
  );
};

export default InvoicePage;
