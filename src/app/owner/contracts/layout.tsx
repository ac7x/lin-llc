// src/modules/contract/interfaces/layout/contract-layout.tsx

"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/lib/firebase-client";
import { collection } from "firebase/firestore";
import type { ContractData } from "@/types/finance";

const ContractNav: React.FC = () => {
  const pathname = usePathname();
  const [contractsSnapshot] = useCollection(collection(db, "contracts"));

  const contracts = contractsSnapshot?.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as (ContractData & { id: string })[] || [];

  return (
    <nav className="space-y-2">
      <Link
        href="/owner/contracts"
        className={`block px-4 py-2 rounded ${
          pathname === "/owner/contracts"
            ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
      >
        所有合約
      </Link>
      {contracts.map((contract) => (
        <Link
          key={contract.id}
          href={`/owner/contracts/${contract.id}`}
          className={`block px-4 py-2 rounded ${
            pathname === `/owner/contracts/${contract.id}`
              ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          {contract.contractName}
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
  const { loading, isAuthenticated, hasMinRole } = useAuth();
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
