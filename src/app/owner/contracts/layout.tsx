// src/modules/contract/interfaces/layout/contract-layout.tsx

"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/lib/firebase-client";
import { collection } from "firebase/firestore";

const ContractNav: React.FC = () => {
    const { user } = useAuth();
    const pathname = usePathname();
    const navs = [
        { label: "合約列表", href: "/owner/contracts" },
        { label: "新增合約", href: "/owner/contracts/create" },
    ];

    const [contractsSnapshot] = useCollection(collection(db, 'contracts'));

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

export default function ContractLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex">
            <ContractNav />
            <div className="flex-1 p-4">{children}</div>
        </div>
    );
}
