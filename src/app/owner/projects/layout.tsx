"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { db, collection, doc } from "@/lib/firebase/firebase-client";
import { updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

function Sidebar() {
    const pathname = usePathname();
    const navs = [
        { label: "專案列表", href: "/owner/projects" },
        { label: "從合約建立專案", href: "/owner/projects/import" },
        { label: "工作包模板", href: "/owner/projects/templates" },
    ];
    const [projectsSnapshot, loading] = useCollection(collection(db, "projects"));
    const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [saving, setSaving] = useState(false);
    const [newWorkpackage, setNewWorkpackage] = useState({
        name: "",
        description: "",
        category: "",
        priority: "medium" as "low" | "medium" | "high",
        budget: 0,
    });

    const toggleOpen = (projectId: string) => {
        setOpenMap(prev => ({ ...prev, [projectId]: !prev[projectId] }));
    };

    const handleAddWorkpackage = async () => {
        if (!newWorkpackage.name.trim() || !selectedProjectId || saving) return;
        setSaving(true);
        try {
            const projectRef = doc(db, "projects", selectedProjectId);
            const projectSnap = projectsSnapshot?.docs.find(doc => doc.id === selectedProjectId);

            if (!projectSnap) throw new Error("專案不存在");

            const project = projectSnap.data();
            const workpackages = project.workpackages || [];

            const newWp = {
                id: Date.now().toString(),
                name: newWorkpackage.name.trim(),
                description: newWorkpackage.description,
                category: newWorkpackage.category,
                priority: newWorkpackage.priority,
                status: "新建立",
                progress: 0,
                budget: newWorkpackage.budget,
                createdAt: new Date().toISOString(),
                subWorkpackages: [],
            };

            await updateDoc(projectRef, {
                workpackages: [...workpackages, newWp],
            });

            setNewWorkpackage({
                name: "",
                description: "",
                category: "",
                priority: "medium",
                budget: 0,
            });
            setShowCreateModal(false);
            setSelectedProjectId("");
        } catch (error) {
            console.error("建立工作包失敗:", error);
            alert("建立工作包失敗");
        } finally {
            setSaving(false);
        }
    };

    return (
        <nav className="w-48 min-h-screen border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 flex flex-col text-black dark:text-gray-100">
            <h2 className="text-lg font-bold mb-4 text-center">專案管理</h2>
            <ul className="space-y-2">
                <li key={navs[0].href}>
                    <Link
                        href={navs[0].href}
                        className={`block px-3 py-2 rounded hover:bg-blue-100 dark:hover:bg-gray-800 ${pathname === navs[0].href ? "bg-blue-200 dark:bg-gray-700 font-bold" : ""}`}
                    >
                        {navs[0].label}
                    </Link>
                </li>
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
                            <li key={projectId} className="flex items-center group">
                                <div className="flex-1">
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
                                        <button
                                            title="封存專案"
                                            className="ml-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                if (!window.confirm('確定要封存此專案？')) return;
                                                const projectData = { ...data, archivedAt: new Date() };
                                                const userId = data.ownerId || "default";
                                                await setDoc(doc(db, "archived", userId, "projects", projectId), projectData);
                                                await deleteDoc(doc(db, "projects", projectId));
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                    {isOpen && (
                                        <div className="pl-8 mt-1">
                                            <ul className="space-y-1">
                                                {workpackages.map((wp: { id: string, name: string, subWorkpackages?: import("@/types/project").SubWorkpackage[] }) => (
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
                                            <button
                                                onClick={() => {
                                                    setSelectedProjectId(projectId);
                                                    setShowCreateModal(true);
                                                }}
                                                className="w-full text-left px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 rounded flex items-center mt-2"
                                            >
                                                <span className="mr-1">+</span> 新增工作包
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </li>
                        );
                    })
                ) : null}
                <li key={navs[1].href}>
                    <Link
                        href={navs[1].href}
                        className={`block px-3 py-2 rounded hover:bg-blue-100 dark:hover:bg-gray-800 ${pathname === navs[1].href ? "bg-blue-200 dark:bg-gray-700 font-bold" : ""}`}
                    >
                        {navs[1].label}
                    </Link>
                </li>
                <li key={navs[2].href}>
                    <Link
                        href={navs[2].href}
                        className={`block px-3 py-2 rounded hover:bg-blue-100 dark:hover:bg-gray-800 ${pathname === navs[2].href ? "bg-blue-200 dark:bg-gray-700 font-bold" : ""}`}
                    >
                        {navs[2].label}
                    </Link>
                </li>
            </ul>
            {showCreateModal && projectsSnapshot && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md text-black dark:text-gray-100">
                        <h2 className="text-xl font-bold mb-4">建立工作包</h2>
                        <form onSubmit={(e) => { e.preventDefault(); handleAddWorkpackage(); }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">工作包名稱</label>
                                <input
                                    type="text"
                                    className="w-full border rounded px-3 py-2"
                                    value={newWorkpackage.name}
                                    onChange={(e) => setNewWorkpackage(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">描述</label>
                                <textarea
                                    className="w-full border rounded px-3 py-2"
                                    value={newWorkpackage.description}
                                    onChange={(e) => setNewWorkpackage(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">類別</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded px-3 py-2"
                                        value={newWorkpackage.category}
                                        onChange={(e) => setNewWorkpackage(prev => ({ ...prev, category: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">預算</label>
                                    <input
                                        type="number"
                                        className="w-full border rounded px-3 py-2"
                                        value={newWorkpackage.budget}
                                        onChange={(e) => setNewWorkpackage(prev => ({ ...prev, budget: Number(e.target.value) }))}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">優先級</label>
                                <select
                                    className="w-full border rounded px-3 py-2"
                                    value={newWorkpackage.priority}
                                    onChange={(e) => setNewWorkpackage(prev => ({ ...prev, priority: e.target.value as "low" | "medium" | "high" }))}
                                >
                                    <option value="low">低</option>
                                    <option value="medium">中</option>
                                    <option value="high">高</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 border rounded hover:bg-gray-100"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                                    disabled={saving || !newWorkpackage.name.trim()}
                                >
                                    {saving ? "建立中..." : "建立工作包"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </nav>
    );
}

export default function ProjectsLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex bg-gray-50 dark:bg-gray-900 min-h-screen">
            <Sidebar />
            <div className="flex-1 p-4 bg-white dark:bg-gray-800 text-black dark:text-gray-100">{children}</div>
        </div>
    );
}