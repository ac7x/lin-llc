// src/modules/contract/interfaces/navigation/side/contract-nav.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ContractNav() {
    const pathname = usePathname();
    const navs = [
        { label: "合約總表", href: "/owner/contracts" },
        { label: "匯入合約", href: "/owner/contracts/import" },
    ];
    return (
        <nav className="w-48 min-h-screen border-r bg-gray-50 dark:bg-gray-900 p-4">
            <h2 className="text-lg font-bold mb-4 text-center">合約管理</h2>
            <ul className="space-y-2">
                <li key={navs[0].href}>
                    <Link
                        href={navs[0].href}
                        className={`block px-3 py-2 rounded hover:bg-blue-100 dark:hover:bg-gray-800 ${pathname === navs[0].href ? "bg-blue-200 dark:bg-gray-700 font-bold" : ""}`}
                    >
                        {navs[0].label}
                    </Link>
                </li>
                <li key={navs[1].href}>
                    <Link
                        href={navs[1].href}
                        className={`block px-3 py-2 rounded hover:bg-blue-100 dark:hover:bg-gray-800 ${pathname === navs[1].href ? "bg-blue-200 dark:bg-gray-700 font-bold" : ""}`}
                    >
                        {navs[1].label}
                    </Link>
                </li>
            </ul>
        </nav>
    );
}
