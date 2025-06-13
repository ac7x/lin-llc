"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/lib/firebase-client";
import { collection } from "firebase/firestore";
import type { InvoiceData } from '@/types/finance';
import { useEffect } from "react";

const InvoiceNav: React.FC = () => {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const baseNavs = [
        { label: "發票列表", href: "/owner/invoices" },
        { label: "新增發票", href: "/owner/invoices/create" },
    ];

    const [invoicesSnapshot] = useCollection(collection(db, 'finance', 'default', 'invoices'));

    // 從數據庫獲取發票列表
    const invoiceNavs = invoicesSnapshot?.docs.map(doc => ({
        label: doc.data().invoiceName || `發票 ${doc.id}`,
        href: `/owner/invoices/${doc.id}`
    })) || [];

    // 合併基礎導航和動態發票導航
    const navs = [
        baseNavs[0],  // 發票列表
        ...invoiceNavs,  // 動態發票列表
        baseNavs[1]   // 新增發票
    ];

    return (
        <nav className="space-y-1">
            {navs.map((nav) => (
                <Link
                    key={nav.href}
                    href={nav.href}
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                        pathname === nav.href
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                >
                    {nav.label}
                </Link>
            ))}
        </nav>
    );
};

export default function InvoicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAuthenticated, hasMinRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!isAuthenticated || !hasMinRole("finance"))) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, hasMinRole, router]);

  if (loading) {
    return <div>載入中...</div>;
  }

  if (!isAuthenticated || !hasMinRole("finance")) {
    return null;
  }

  return (
    <div className="flex">
      <div className="w-64 p-4 bg-white dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700">
        <InvoiceNav />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
