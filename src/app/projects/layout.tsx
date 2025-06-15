/**
 * 專案模組布局
 * 
 * 提供專案相關頁面的共用布局，包含：
 * - 專案側邊導航選單
 * - 工作包管理功能
 * - 專案快速操作
 * - 響應式設計
 */

"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from "react-firebase-hooks/firestore";
import { ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { ProjectProgressPercent } from "@/utils/projectProgress";
import { WorkpackageProgressBar } from "@/utils/workpackageProgressBar";
import type { Project } from "@/types/project";
import { PageLayout, PageContent, Sidebar } from "@/components/layouts/PageLayout";

function SidebarContent() {
    const { db, collection, doc, updateDoc, setDoc, deleteDoc, Timestamp, userRole } = useAuth();
    const pathname = usePathname();
    const navs = [
        { label: "專案列表", href: "/projects", icon: "📋" },
        { label: "從合約建立專案", href: "/projects/import", icon: "📄" },
        { label: "工作包模板", href: "/projects/templates", icon: "📑" },
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
                createdAt: Timestamp.now(),
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

    const projects = projectsSnapshot?.docs
        .map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
        .filter(project => {
            // admin 和 owner 可以看到所有專案
            if (userRole === 'admin' || userRole === 'owner') {
                return true;
            }
            
            // 其他角色只能看到有設置角色的專案
            const projectData = project as unknown as Project;
            const projectRoles = projectData.roles || [];
            return userRole ? projectRoles.includes(userRole) : false;
        }) as (Project & { id: string })[] || [];

    return (
        <>
            <ul className="space-y-2">
                {navs.map(nav => (
                    <li key={nav.href}>
                        <Link
                            href={nav.href}
                            className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-gray-800 ${
                                pathname === nav.href 
                                ? "bg-blue-100 dark:bg-gray-800 font-medium text-blue-600 dark:text-blue-400" 
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                        >
                            <span className="mr-3">{nav.icon}</span>
                            {nav.label}
                        </Link>
                    </li>
                ))}
            </ul>
            <div className="flex-1 overflow-y-auto mt-4">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {projects.map((project) => (
                            <li key={project.id} className="group">
                                <div className="flex items-center">
                                    <button
                                        type="button"
                                        aria-label={openMap[project.id] ? "收合" : "展開"}
                                        onClick={() => toggleOpen(project.id)}
                                        className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors duration-200 flex-shrink-0"
                                    >
                                        {openMap[project.id] ? (
                                            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                                        ) : (
                                            <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                                        )}
                                    </button>
                                    <Link
                                        href={`/projects/${project.id}`}
                                        className={`flex-1 min-w-0 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-gray-800 ${
                                            pathname === `/projects/${project.id}` 
                                            ? "bg-blue-100 dark:bg-gray-800 font-medium text-blue-600 dark:text-blue-400" 
                                            : "text-gray-700 dark:text-gray-300"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="truncate">{project.projectName || project.projectId || project.id}</span>
                                            <ProjectProgressPercent project={project} />
                                        </div>
                                    </Link>
                                    <button
                                        title="封存專案"
                                        className="ml-2 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0"
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            if (!window.confirm('確定要封存此專案？')) return;
                                            const projectData = { ...project, archivedAt: new Date() };
                                            const userId = project.owner || "default";
                                            await setDoc(doc(db, "archived", userId, "projects", project.id), projectData);
                                            await deleteDoc(doc(db, "projects", project.id));
                                        }}
                                    >
                                        🗑️
                                    </button>
                                </div>
                                {openMap[project.id] && (
                                    <div className="pl-12 mt-2 space-y-2">
                                        {project.workpackages?.map((wp) => (
                                            <div key={wp.id} className="group/item">
                                                <Link
                                                    href={`/projects/${project.id}/workpackages/${wp.id}`}
                                                    className={`block px-4 py-2 rounded-lg text-sm transition-all duration-200 hover:bg-blue-50 dark:hover:bg-gray-800 ${
                                                        pathname.includes(`/workpackages/${wp.id}`) 
                                                        ? "bg-blue-100 dark:bg-gray-800 font-medium text-blue-600 dark:text-blue-400" 
                                                        : "text-gray-600 dark:text-gray-400"
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="truncate">{wp.name}</span>
                                                        <span className="text-xs text-gray-500 flex-shrink-0">
                                                            {(wp.subWorkpackages?.length || 0) > 0 && `(${wp.subWorkpackages?.length})`}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1">
                                                        <WorkpackageProgressBar wp={wp as import("@/types/project").Workpackage} />
                                                    </div>
                                                </Link>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => {
                                                setSelectedProjectId(project.id);
                                                setShowCreateModal(true);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200 flex items-center"
                                        >
                                            <span className="mr-2">+</span> 新增工作包
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {showCreateModal && projectsSnapshot && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md text-black dark:text-gray-100">
                        <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">建立工作包</h2>
                        <form onSubmit={(e) => { e.preventDefault(); handleAddWorkpackage(); }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">工作包名稱</label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                    value={newWorkpackage.name}
                                    onChange={(e) => setNewWorkpackage(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">描述</label>
                                <textarea
                                    className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                    value={newWorkpackage.description}
                                    onChange={(e) => setNewWorkpackage(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">類別</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                        value={newWorkpackage.category}
                                        onChange={(e) => setNewWorkpackage(prev => ({ ...prev, category: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">預算</label>
                                    <input
                                        type="number"
                                        className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                        value={newWorkpackage.budget}
                                        onChange={(e) => setNewWorkpackage(prev => ({ ...prev, budget: Number(e.target.value) }))}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">優先級</label>
                                <select
                                    className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                    value={newWorkpackage.priority}
                                    onChange={(e) => setNewWorkpackage(prev => ({ ...prev, priority: e.target.value as "low" | "medium" | "high" }))}
                                >
                                    <option value="low">低</option>
                                    <option value="medium">中</option>
                                    <option value="high">高</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
                                    disabled={saving || !newWorkpackage.name.trim()}
                                >
                                    {saving ? "建立中..." : "建立工作包"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default function ProjectsLayout({ children }: { children: ReactNode }) {
    return (
        <PageLayout withSidebar>
            <Sidebar>
                <SidebarContent />
            </Sidebar>
            <PageContent>
                {children}
            </PageContent>
        </PageLayout>
    );
}