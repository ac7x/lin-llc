"use client";

import React from "react";
import Link from "next/link";
import { useFirebase, useCollection } from '@/hooks/useFirebase';
import type { InvoiceData } from '@/types/finance';

const navItems = [
  { label: "所有發票", href: "/owner/invoices" },
  { label: "新增發票", href: "/owner/invoices/create" },
];

const InvoiceNav: React.FC = () => {
  const { db, collection } = useFirebase();
  const [invoicesSnapshot, loading, error] = useCollection(collection(db, 'finance', 'default', 'invoice'));

  return (
    <nav className="w-56 min-h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">發票選單</h2>
      <ul className="space-y-2">
        {/* 所有發票 */}
        <li key={navItems[0].href}>
          <Link
            href={navItems[0].href}
            className="block px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
          >
            {navItems[0].label}
          </Link>
        </li>
        {/* 動態發票清單 */}
        <li>
          <div className="mt-2 mb-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">發票清單</div>
            <div className="max-h-56 overflow-y-auto">
              {loading && <div className="text-gray-400 text-xs">載入中...</div>}
              {error && <div className="text-red-500 text-xs">載入失敗</div>}
              {!loading && invoicesSnapshot && invoicesSnapshot.size > 0 ? (
                <ul className="space-y-1">
                  {invoicesSnapshot.docs.map(doc => {
                    const data = doc.data() as InvoiceData;
                    return (
                      <li key={doc.id}>
                        <Link
                          href={`/owner/invoices/${doc.id}`}
                          className="flex justify-between items-center px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200"
                        >
                          <span className="truncate max-w-[110px]" title={data.invoiceName || doc.id}>{data.invoiceName || doc.id}</span>
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{data.status}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : !loading && (
                <div className="text-gray-400 text-xs">尚無發票</div>
              )}
            </div>
          </div>
        </li>
        {/* 新增發票 */}
        <li key={navItems[1].href}>
          <Link
            href={navItems[1].href}
            className="block px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
          >
            {navItems[1].label}
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default InvoiceNav;
