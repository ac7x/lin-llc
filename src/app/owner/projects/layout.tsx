"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection } from "firebase/firestore";
import { useFirebase } from "@/modules/shared/infrastructure/persistence/firebase/FirebaseContext";
import { ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

function Sidebar() {
    const { db } = useFirebase();
    const pathname = usePathname();
    const navs = [
        { label: "專案列表", href: "/owner/projects" },
        { label: "從合約建立專案", href: "/owner/projects/import" },
    ];
    const [projectsSnapshot, loading] = useCollection(collection(db, "projects"));
    const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

    const toggleOpen = (projectId: string) => {
        setOpenMap(prev => ({ ...prev, [projectId]: !prev[projectId] }));
    };

    return (
        <nav className="w-48 min-h-screen border-r bg-gray-50 dark:bg-gray-900 p-4 flex flex-col">
            <h2 className="text-lg font-bold mb-4 text-center">專案管理</h2>
            <ul className="space-y-2">
                {/* 專案列表按鈕 */}
                <li key={navs[0].href}>
                    <Link
                        href={navs[0].href}
                        className={`block px-3 py-2 rounded hover:bg-blue-100 dark:hover:bg-gray-800 ${pathname === navs[0].href ? "bg-blue-200 dark:bg-gray-700 font-bold" : ""}`}
                    >
                        {navs[0].label}
                    </Link>
                </li>
                {/* 動態專案列表 */}
                {loading ? (
                    <li className="text-gray-400 px-3 py-2">載入中...</li>
                ) : projectsSnapshot && projectsSnapshot.docs.length > 0 ? (
                    projectsSnapshot.docs.map(project => {
                        const data = project.data();
                        const projectId = project.id;
                        const projectHref = `/owner/projects/${projectId}`;
                        const isOpen = !!openMap[projectId];
                        const workpackages = data.workpackages || [];

                        return (
                            <li key={projectId}>
                                <div>
                                    {/* 專案主項 */}
                                    <div className="flex items-center">
                                        <button
                                            type="button"
                                            aria-label={isOpen ? "收合" : "展開"}
                                            onClick={() => toggleOpen(projectId)}
                                            className="p-1 mr-1 rounded hover:bg-blue-100 dark:hover:bg-gray-800"
                                        >
                                            {isOpen ? (
                                                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                                            ) : (
                                                <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                                            )}
                                        </button>
                                        <Link
                                            href={projectHref}
                                            className={`flex-1 block px-3 py-2 rounded hover:bg-blue-100 dark:hover:bg-gray-800 ${pathname === projectHref ? "bg-blue-200 dark:bg-gray-700 font-bold" : ""}`}
                                        >
                                            {data.projectName || data.projectId || projectId}
                                        </Link>
                                    </div>
                                    {/* 工作包列表 */}
                                    {isOpen && workpackages.length > 0 && (
                                        <ul className="pl-8 mt-1 space-y-1">
                                            {workpackages.map((wp: { id: string, name: string, subWorkpackages?: any[] }) => (
                                                <li key={wp.id}>
                                                    <Link
                                                        href={`/owner/projects/${projectId}/workpackages/${wp.id}`}
                                                        className={`block px-3 py-1 rounded text-sm hover:bg-blue-100 dark:hover:bg-gray-800 ${pathname.includes(`/workpackages/${wp.id}`) ? "bg-blue-200 dark:bg-gray-700 font-bold" : ""}`}
                                                    >
                                                        {wp.name} {(wp.subWorkpackages?.length || 0) > 0 && `(${wp.subWorkpackages?.length})`}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </li>
                        );
                    })
                ) : null}
                {/* 從合約建立專案按鈕 */}
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

export default function ProjectsLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-1 p-4">{children}</div>
        </div>
    );
}