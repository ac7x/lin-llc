"use client";

import { useParams, useRouter } from "next/navigation";
import { useDocument } from "react-firebase-hooks/firestore";
import { useState, useMemo, useEffect } from "react";
// 新增 DND 相關引入
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ProjectJournalPage from "./project-journal/page";
import ProjectMaterialsPage from "./project-materials/page";
import ProjectIssuesPage from "./project-issues/page";
import SubWorkpackageSortingPage from "./workpackages/subworkpackages/page";
import ProjectCalendarPage from "./project-calendar/page";
import { TaiwanCityList } from "@/utils/taiwan-city.enum";
import { Project, Workpackage } from "@/types/project";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useAuth } from '@/hooks/useAuth';

function getWorkpackageProgress(wp: Workpackage): number {
    if (!wp.subWorkpackages || wp.subWorkpackages.length === 0) return 0;
    let done = 0;
    let total = 0;
    for (const sw of wp.subWorkpackages) {
        if (typeof sw.estimatedQuantity === 'number' && sw.estimatedQuantity > 0) {
            done += typeof sw.actualQuantity === 'number' ? sw.actualQuantity : 0;
            total += sw.estimatedQuantity;
        }
    }
    if (total === 0) return 0;
    return Math.round((done / total) * 100);
}

function SortableWorkpackage({ wp, projectId }: { wp: Workpackage; projectId: string }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({ id: wp.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="border rounded p-3 flex justify-between items-center bg-gray-50 dark:bg-gray-700"
        >
            <div className="flex-1 cursor-grab" {...attributes} {...listeners}>
                <div className="font-medium">{wp.name}</div>
                <div className="text-sm text-gray-500">
                    • 進度: {getWorkpackageProgress(wp)}% • 狀態: {wp.status || ''}
                </div>
            </div>
            <a
                href={`/owner/projects/${projectId}/workpackages/${wp.id}`}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
                檢視
            </a>
        </div>
    );
}

export default function ProjectDetailPage() {
    const { db, doc, updateDoc, Timestamp } = useAuth();
    const params = useParams();
    const projectId = params?.project as string;
    const [projectDoc, loading, error] = useDocument(doc(db, "projects", projectId));
    const [tab, setTab] = useState<
        "journal" | "materials" | "issues" | "info" | "calendar" | "subworkpackages"
    >("journal");
    const [isEditing, setIsEditing] = useState(false);

    // 使用 useMemo 取得 project 物件
    const project = useMemo(() => {
        if (!projectDoc?.exists()) return null;
        return projectDoc.data() as Project;
    }, [projectDoc]);

    // 使用 useMemo 取得 workpackages
    const workpackages = useMemo(() => {
        return project?.workpackages || [];
    }, [project]);

    // 新增感應器設置
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 新增處理拖曳結束事件
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = workpackages.findIndex(wp => wp.id === active.id);
            const newIndex = workpackages.findIndex(wp => wp.id === over.id);

            const updatedWorkpackages = arrayMove(workpackages, oldIndex, newIndex);

            // 更新到 Firestore
            try {
                await updateDoc(doc(db, "projects", projectId), {
                    workpackages: updatedWorkpackages
                });
            } catch (error) {
                console.error("更新工作包順序失敗:", error);
                alert("更新順序時出錯，請重試。");
            }
        }
    };

    const handleUpdateProject = async (formData: FormData) => {
        try {
            const startDate = formData.get("startDate")?.toString();
            const estimatedEndDate = formData.get("estimatedEndDate")?.toString();

            const updates = {
                projectName: formData.get("projectName"),
                contractId: formData.get("contractId"),
                coordinator: formData.get("coordinator"),
                supervisor: formData.get("supervisor"),
                safetyOfficer: formData.get("safetyOfficer"),
                region: formData.get("region"),
                address: formData.get("address"),
                owner: formData.get("owner"),
                startDate: startDate ? Timestamp.fromDate(new Date(startDate)) : null,
                estimatedEndDate: estimatedEndDate ? Timestamp.fromDate(new Date(estimatedEndDate)) : null,
                updatedAt: Timestamp.now()
            };

            await updateDoc(doc(db, "projects", projectId), updates);
            setIsEditing(false);
        } catch (error) {
            console.error("更新專案資訊失敗:", error);
            alert("更新失敗，請重試");
        }
    };

    if (loading) return <div>載入中...</div>;
    if (error) return <div>錯誤: {error.message}</div>;
    if (!project) return <div>找不到專案</div>;

    const renderTabContent = () => {
        switch (tab) {
            case "info":
                return (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold">專案資訊</h2>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-blue-500 text-white p-1 rounded-full hover:bg-blue-600 w-8 h-8 flex items-center justify-center"
                                title="編輯"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                        </div>

                        {/* 編輯表單彈窗 */}
                        {isEditing && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl">
                                    <h2 className="text-xl font-bold mb-4">編輯專案資訊</h2>
                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.target as HTMLFormElement);
                                        await handleUpdateProject(formData);
                                    }} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">專案名稱</label>
                                                <input name="projectName" defaultValue={project.projectName} className="border rounded w-full px-3 py-2" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">合約ID</label>
                                                <input name="contractId" defaultValue={project.contractId} className="border rounded w-full px-3 py-2" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">協調者</label>
                                                <input name="coordinator" defaultValue={project.coordinator} className="border rounded w-full px-3 py-2" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">監工</label>
                                                <input name="supervisor" defaultValue={project.supervisor} className="border rounded w-full px-3 py-2" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">安全人員</label>
                                                <input name="safetyOfficer" defaultValue={project.safetyOfficer} className="border rounded w-full px-3 py-2" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">地區</label>
                                                <select
                                                    name="region"
                                                    defaultValue={project.region || ""}
                                                    className="border rounded w-full px-3 py-2 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                >
                                                    <option value="">請選擇</option>
                                                    {TaiwanCityList.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">地址</label>
                                                <input name="address" defaultValue={project.address} className="border rounded w-full px-3 py-2" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">業主</label>
                                                <input name="owner" defaultValue={project.owner} className="border rounded w-full px-3 py-2" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">起始日</label>
                                                <input type="date" name="startDate" defaultValue={project.startDate?.toDate().toISOString().split('T')[0]} className="border rounded w-full px-3 py-2" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">預估結束日</label>
                                                <input type="date" name="estimatedEndDate" defaultValue={project.estimatedEndDate?.toDate().toISOString().split('T')[0]} className="border rounded w-full px-3 py-2" />
                                            </div>
                                        </div>
                                        <div className="flex justify-end space-x-2 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => setIsEditing(false)}
                                                className="px-4 py-2 border border-gray-300 rounded shadow hover:bg-gray-200 hover:text-gray-900"
                                            >
                                                取消
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
                                            >
                                                確認儲存
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-gray-500">專案名稱</label>
                                <div>{project.projectName}</div>
                            </div>
                            <div>
                                <label className="text-gray-500">合約ID</label>
                                <div>{project.contractId || '-'}</div>
                            </div>
                            <div>
                                <label className="text-gray-500">協調者</label>
                                <div>{project.coordinator || '-'}</div>
                            </div>
                            <div>
                                <label className="text-gray-500">監工</label>
                                <div>{project.supervisor || '-'}</div>
                            </div>
                            <div>
                                <label className="text-gray-500">安全人員</label>
                                <div>{project.safetyOfficer || '-'}</div>
                            </div>
                            <div>
                                <label className="text-gray-500">地區</label>
                                <div>{project.region || '-'}</div>
                            </div>
                            <div>
                                <label className="text-gray-500">地址</label>
                                <div>{project.address || '-'}</div>
                            </div>
                            <div>
                                <label className="text-gray-500">業主</label>
                                <div>{project.owner || '-'}</div>
                            </div>
                            <div>
                                <label className="text-gray-500">起始日</label>
                                <div>{project.startDate ? project.startDate.toDate().toLocaleDateString() : '-'}</div>
                            </div>
                            <div>
                                <label className="text-gray-500">預估結束日</label>
                                <div>{project.estimatedEndDate ? project.estimatedEndDate.toDate().toLocaleDateString() : '-'}</div>
                            </div>
                        </div>

                        {/* 工作包列表 */}
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-3">工作包</h3>
                            {workpackages && workpackages.length > 0 ? (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={workpackages.map(wp => wp.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-2">
                                            {workpackages.map((wp) => (
                                                <SortableWorkpackage
                                                    key={wp.id}
                                                    wp={wp}
                                                    projectId={projectId}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            ) : (
                                <p className="text-gray-500 italic">尚未建立工作包</p>
                            )}
                        </div>
                    </div>
                );
            case "journal":
                return <ProjectJournalPage />;
            case "calendar":
                return <ProjectCalendarPage />;
            case "issues":
                return <ProjectIssuesPage />;
            case "subworkpackages":
                return <SubWorkpackageSortingPage />;
            case "materials":
                return <ProjectMaterialsPage />;
            default:
                return null;
        }
    };

    return (
        <main className="max-w-4xl mx-auto p-4 bg-white dark:bg-gray-900">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">{project.projectName}</h1>
                <div className="text-gray-600 dark:text-gray-300">狀態: {project.status}</div>
            </div>

            {/* Tabs - 依使用頻率重新排序 */}
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-1 overflow-x-auto bg-white dark:bg-gray-900">
                <button
                    className={`px-4 py-2 -mb-px border-b-2 ${tab === "journal"
                        ? "border-blue-600 text-blue-600 font-bold dark:border-blue-400 dark:text-blue-400"
                        : "border-transparent text-gray-600 dark:text-gray-300"
                        }`}
                    onClick={() => setTab("journal")}
                >
                    工作日誌
                </button>
                <button
                    className={`px-4 py-2 -mb-px border-b-2 ${tab === "calendar"
                        ? "border-blue-600 text-blue-600 font-bold dark:border-blue-400 dark:text-blue-400"
                        : "border-transparent text-gray-600 dark:text-gray-300"
                        }`}
                    onClick={() => setTab("calendar")}
                >
                    行程
                </button>
                <button
                    className={`px-4 py-2 -mb-px border-b-2 ${tab === "issues"
                        ? "border-blue-600 text-blue-600 font-bold dark:border-blue-400 dark:text-blue-400"
                        : "border-transparent text-gray-600 dark:text-gray-300"
                        }`}
                    onClick={() => setTab("issues")}
                >
                    問題追蹤
                </button>
                <button
                    className={`px-4 py-2 -mb-px border-b-2 ${tab === "subworkpackages"
                        ? "border-blue-600 text-blue-600 font-bold dark:border-blue-400 dark:text-blue-400"
                        : "border-transparent text-gray-600 dark:text-gray-300"
                        }`}
                    onClick={() => setTab("subworkpackages")}
                >
                    子工作包排序
                </button>
                <button
                    className={`px-4 py-2 -mb-px border-b-2 ${tab === "materials"
                        ? "border-blue-600 text-blue-600 font-bold dark:border-blue-400 dark:text-blue-400"
                        : "border-transparent text-gray-600 dark:text-gray-300"
                        }`}
                    onClick={() => setTab("materials")}
                >
                    材料管理
                </button>
                <button
                    className={`px-4 py-2 -mb-px border-b-2 ${tab === "info"
                        ? "border-blue-600 text-blue-600 font-bold dark:border-blue-400 dark:text-blue-400"
                        : "border-transparent text-gray-600 dark:text-gray-300"
                        }`}
                    onClick={() => setTab("info")}
                >
                    專案資訊
                </button>
            </div>

            {/* Tab Content */}
            {renderTabContent()}
        </main>
    );
}
