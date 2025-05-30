import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

export function QuoteSideNav() {
    const pathname = usePathname();
    const navs = [
        { label: "報價列表", href: "/owner/quotes" },
        { label: "新增報價", href: "/owner/quotes/add" },
    ];
    const [quotesSnapshot, loading, error] = useCollection(collection(db, "quotes"));
    return (
        <nav className="w-48 min-h-screen border-r bg-gray-50 dark:bg-gray-900 p-4">
            <h2 className="text-lg font-bold mb-4 text-center">報價管理</h2>
            <ul className="space-y-2">
                {/* 列表按鈕 */}
                <li key={navs[0].href}>
                    <Link
                        href={navs[0].href}
                        className={`block px-3 py-2 rounded hover:bg-blue-100 dark:hover:bg-gray-800 ${pathname === navs[0].href ? "bg-blue-200 dark:bg-gray-700 font-bold" : ""}`}
                    >
                        {navs[0].label}
                    </Link>
                </li>
                {/* 動態報價詳情按鈕 */}
                {loading ? (
                    <li className="text-gray-400 px-3 py-2">載入中...</li>
                ) : error ? (
                    <li className="text-red-500 px-3 py-2">{String(error)}</li>
                ) : quotesSnapshot && quotesSnapshot.docs.length > 0 ? (
                    quotesSnapshot.docs.map(quote => {
                        const data = quote.data();
                        const quoteHref = `/owner/quotes/${data.quoteId || quote.id}`;
                        return (
                            <li key={data.quoteId || quote.id}>
                                <Link
                                    href={quoteHref}
                                    className={`block px-3 py-2 rounded hover:bg-blue-100 dark:hover:bg-gray-800 ${pathname === quoteHref ? "bg-blue-200 dark:bg-gray-700 font-bold" : ""}`}
                                >
                                    {data.quoteName || data.quoteId || quote.id}
                                </Link>
                            </li>
                        );
                    })
                ) : null}
                {/* 新增按鈕 */}
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