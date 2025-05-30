"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardNav() {
    const pathname = usePathname();
    const navs = [
        { label: "儀表板", href: "/owner/dashboard" },
        // 可依需求新增更多選單項目
    ];
    return (
        <nav className="w-48 min-h-screen border-r bg-gray-50 dark:bg-gray-900 p-4">
            <h2 className="text-lg font-bold mb-4 text-center">儀表板管理</h2>
            <ul className="space-y-2">
                {navs.map((nav) => (
                    <li key={nav.href}>
                        <Link
                            href={nav.href}
                            className={`block px-3 py-2 rounded hover:bg-blue-100 dark:hover:bg-gray-800 ${pathname === nav.href ? "bg-blue-200 dark:bg-gray-700 font-bold" : ""}`}
                        >
                            {nav.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
