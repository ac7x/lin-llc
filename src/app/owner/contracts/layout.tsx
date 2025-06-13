// src/modules/contract/interfaces/layout/contract-layout.tsx

"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/lib/firebase-client";
import { collection } from "firebase/firestore";
import { useEffect } from "react";

const ContractNav: React.FC = () => {
    const { user } = useAuth();
    const pathname = usePathname();
    const baseNavs = [
        { label: "合約列表", href: "/owner/contracts" },
        { label: "新增合約", href: "/owner/contracts/create" },
    ];

    const [contractsSnapshot] = useCollection(collection(db, 'finance', 'default', 'contracts'));

    // 從數據庫獲取合約列表
    const contractNavs = contractsSnapshot?.docs.map(doc => ({
        label: doc.data().contractName || `合約 ${doc.id}`,
        href: `/owner/contracts/${doc.id}`
    })) || [];

    // 合併基礎導航和動態合約導航，確保合約列表在最上方，新增合約在最下方
    const navs = [
        baseNavs[0],  // 合約列表
        ...contractNavs,  // 動態合約列表
        baseNavs[1]   // 新增合約
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

export default function ContractsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAuthenticated, hasMinRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!isAuthenticated || !hasMinRole("admin"))) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, hasMinRole, router]);

  if (loading) {
    return <div>載入中...</div>;
  }

  if (!isAuthenticated || !hasMinRole("admin")) {
    return null;
  }

  return (
    <div className="flex">
      <div className="w-64 p-4 bg-white dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700">
        <ContractNav />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
