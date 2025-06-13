"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ArchivedNav = () => {
    const pathname = usePathname();
    const navs = [
        { label: "封存訂單", href: "/archive/orders" },
        { label: "封存估價單", href: "/archive/quotes" },
        { label: "封存合約", href: "/archive/contracts" },
        { label: "封存專案", href: "/archive/projects" },
        { label: "封存支出", href: "/archive/expenses" },
    ];
    return (
        <nav className="w-64 min-h-screen border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">封存管理</h2>
            <ul className="space-y-2">
                {navs.map((nav) => (
                    <li key={nav.href}>
                        <Link
                            href={nav.href}
                            className={`block px-4 py-2.5 rounded-lg transition-colors duration-200 ${
                                pathname === nav.href 
                                    ? "bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-medium" 
                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            }`}
                        >
                            {nav.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default function ArchivedLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            <ArchivedNav />
            <div className="flex-1 p-6">{children}</div>
        </div>
    );
}
