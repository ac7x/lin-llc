"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { Disclosure } from '@headlessui/react';
import { Zone } from "@/types/project";

export default function ProjectsLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [addingZone, setAddingZone] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [zoneName, setZoneName] = useState("");
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const navs = [
        { label: "專案列表", href: "/owner/projects" },
        { label: "從合約建立專案", href: "/owner/projects/import" },
    ];
    const [projectsSnapshot, loading] = useCollection(collection(db, "projects"));

    return (
        <div className="flex">
            <nav className="w-48 min-h-screen border-r bg-gray-50 dark:bg-gray-900 p-4">
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
                            const projectHref = `/owner/projects/${project.id}`;
                            return (
                                <li key={project.id} className="group">
                                    <Disclosure defaultOpen={false}>
                                        {({ open }) => (
                                            <div>
                                                <div className="flex items-center">
                                                    <Disclosure.Button
                                                        className="p-1 mr-1 text-gray-500 hover:text-blue-500 focus:outline-none"
                                                    >
                                                        <svg
                                                            className={`w-4 h-4 transform transition-transform ${open ? 'rotate-180' : ''
                                                                }`}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M19 9l-7 7-7-7"
                                                            />
                                                        </svg>
                                                    </Disclosure.Button>
                                                    <Link
                                                        href={projectHref}
                                                        className={`flex-1 block px-3 py-2 rounded hover:bg-blue-100 dark:hover:bg-gray-800 ${pathname === projectHref ? "bg-blue-200 dark:bg-gray-700 font-bold" : ""}`}
                                                    >
                                                        {data.projectName || data.projectId || project.id}
                                                    </Link>
                                                </div>

                                                <Disclosure.Panel>
                                                    {data.zones && data.zones.length > 0 && ( // zones 作為陣列進行渲染
                                                        <ul className="ml-8 mt-1 space-y-1">
                                                            {data.zones.map((zone: Zone) => (
                                                                <li key={zone.zoneId}>
                                                                    <Link
                                                                        href={`/owner/projects/${project.id}/zones/${zone.zoneId}`}
                                                                        className={`block px-3 py-1 text-sm rounded hover:bg-blue-100 dark:hover:bg-gray-800 ${pathname === `/owner/projects/${project.id}/zones/${zone.zoneId}` ? "bg-blue-200 dark:bg-gray-700" : ""}`}
                                                                    >
                                                                        {zone.zoneName}
                                                                    </Link>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                    {/* 現代化圓形新增分區按鈕（小巧和諧） */}
                                                    <div className="ml-8 mt-3 flex">
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setSelectedProjectId(project.id);
                                                                setZoneName("");
                                                                setShowModal(true);
                                                            }}
                                                            className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-400 hover:bg-blue-500 active:bg-blue-600 text-white shadow transition-colors"
                                                            title="新增分區"
                                                            style={{ fontSize: 0 }}
                                                        >
                                                            <svg
                                                                className="w-3.5 h-3.5"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M12 5v14m7-7H5"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </Disclosure.Panel>
                                            </div>
                                        )}
                                    </Disclosure>
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
            <div className="flex-1 p-4">{children}</div>

            {/* 新增分區彈窗 */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowModal(false);
                        }
                    }}
                >
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg w-80">
                        <h3 className="text-lg font-bold mb-4">新增分區</h3>
                        <input
                            type="text"
                            value={zoneName}
                            onChange={(e) => setZoneName(e.target.value)}
                            placeholder="請輸入分區名稱"
                            className="w-full border p-2 rounded mb-4 dark:bg-gray-700"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-gray-500"
                            >
                                取消
                            </button>
                            <button
                                onClick={async () => {
                                    if (!zoneName.trim() || addingZone) return;
                                    setAddingZone(selectedProjectId);
                                    try {
                                        const projectDoc = projectsSnapshot?.docs.find(d => d.id === selectedProjectId);
                                        const data = projectDoc?.data();
                                        await updateDoc(doc(db, "projects", selectedProjectId), {
                                            zones: arrayUnion({
                                                zoneId: Math.random().toString(36).slice(2, 10),
                                                zoneName: zoneName.trim(),
                                                desc: "",
                                                order: (data?.zones?.length || 0),
                                                createdAt: new Date()
                                            })
                                        });
                                        setShowModal(false);
                                    } catch {
                                        alert("新增分區失敗");
                                    }
                                    setAddingZone(null);
                                }}
                                disabled={!zoneName.trim() || !!addingZone}
                                className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
                            >
                                {addingZone ? "新增中..." : "確定"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}