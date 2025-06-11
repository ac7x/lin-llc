import React from 'react';
import InvoiceNav from '@/components/side/invoice-nav';

const InvoiceLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 左側：發票列表與功能選單 */}
      <InvoiceNav />
      {/* 右側：動態票務列表（children） */}
      <main className="flex-1 bg-white dark:bg-gray-900">
        {children}
      </main>
    </div>
  );
};

export default InvoiceLayout;
