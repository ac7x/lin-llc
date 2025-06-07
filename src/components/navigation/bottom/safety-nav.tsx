// safety-nav.tsx
"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
    { href: "/safety/dashboard", icon: "🦺", label: "儀表板" },
    { href: "/safety/projects", icon: "📁", label: "專案" },
    { href: "/safety/orders", icon: "📦", label: "訂單" },
    { href: "/shared/profile", icon: "🧑‍🔧", label: "個人資料" }, // 改為共用 profile

];

export function SafetyNav() {
    const pathname = usePathname();
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 z-50">
            <div className="flex h-16 mx-auto items-center w-full overflow-x-auto whitespace-nowrap justify-center">
                {navItems.map((item) => {
                    const active = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex-1 min-w-0 inline-flex flex-col items-center justify-center h-full px-2 sm:px-5 max-w-[120px] transition-colors duration-150 ${active
                                ? 'text-blue-600 font-semibold border-t-2 border-blue-600 bg-blue-50 dark:bg-blue-900 dark:text-blue-400 dark:border-blue-400'
                                : 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400'}
                            `}
                            style={{ minWidth: '76px' }}
                        >
                            <div className="text-xl sm:text-2xl">{item.icon}</div>
                            <span className="text-[11px] sm:text-xs truncate block">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
