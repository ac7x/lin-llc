"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { db, collection, doc, setDoc, deleteDoc } from "@/lib/firebase-client";
import { useCollection } from "react-firebase-hooks/firestore";

export function QuoteSideNav() {
    const pathname = usePathname();
    const navs = [
        { label: "估價單列表", href: "/owner/quotes" },
        { label: "新增估價單", href: "/owner/quotes/add" },
    ];
    const [quotesSnapshot, loading, error] = useCollection(collection(db, "finance", "default", "quotes"));

    return (
        <nav className="w-48 min-h-screen border-r bg-gray-50 dark:bg-gray-900 p-4">
            <h2 className="text-lg font-bold mb-4 text-center">估價單管理</h2>
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
                {/* 動態估價單詳情按鈕 */}
                {loading ? (
                    <li className="text-gray-400 px-3 py-2">載入中...</li>
                ) : error ? (
                    <li className="text-red-500 px-3 py-2">{String(error)}</li>
                ) : quotesSnapshot && quotesSnapshot.docs.length > 0 ? (
                    quotesSnapshot.docs.map(quote => {
                        const data = quote.data();
                        const quoteHref = `/owner/quotes/${data.quoteId || quote.id}`;
                        return (
                            <li key={data.quoteId || quote.id} className="flex items-center group">
                                <Link
                                    href={quoteHref}
                                    className={`flex-1 block px-3 py-2 rounded hover:bg-blue-100 dark:hover:bg-gray-800 ${pathname === quoteHref ? "bg-blue-200 dark:bg-gray-700 font-bold" : ""}`}
                                >
                                    {data.quoteName || data.quoteId || quote.id}
                                </Link>
                                <button
                                    title="封存估價單"
                                    className="ml-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        if (!window.confirm('確定要封存此估價單？')) return;
                                        const quoteData = { ...data, archivedAt: new Date() };
                                        // 封存到 archived/{userId}/quotes/{quoteId}
                                        const userId = data.ownerId || "default";
                                        await setDoc(doc(db, "archived", userId, "quotes", data.quoteId || quote.id), quoteData);
                                        await deleteDoc(doc(db, "quotes", data.quoteId || quote.id));
                                    }}
                                >
                                    🗑️
                                </button>
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
