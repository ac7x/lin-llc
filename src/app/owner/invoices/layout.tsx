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
    const pathname = usePathname();
    const [invoicesSnapshot] = useCollection(collection(db, "invoices"));

    const invoices = invoicesSnapshot?.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as (InvoiceData & { id: string })[] || [];

    return (
        <nav className="space-y-2">
            <Link
                href="/owner/invoices"
                className={`block px-4 py-2 rounded ${
                    pathname === "/owner/invoices"
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
            >
                所有發票
            </Link>
            {invoices.map((invoice) => (
                <Link
                    key={invoice.id}
                    href={`/owner/invoices/${invoice.id}`}
                    className={`block px-4 py-2 rounded ${
                        pathname === `/owner/invoices/${invoice.id}`
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                >
                    {invoice.invoiceName || `發票 ${invoice.invoiceNumber}`}
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
  const { loading, isAuthenticated, hasMinRole } = useAuth();
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
