"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useFirebase } from "@/hooks/useFirebase";
import { useDocument } from "react-firebase-hooks/firestore";
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
import { Workpackage, SubWorkpackage } from "@/types/project";

interface EnhancedSubWorkpackage extends SubWorkpackage {
    workpackageId: string;
    workpackageName: string;
    estimatedQuantity?: number;
    actualQuantity?: number;
}

function SortableSubWorkpackage({
    subWp,
    index,
    onEdit
}: {
    subWp: EnhancedSubWorkpackage;
    index: number;
    onEdit: (subWp: EnhancedSubWorkpackage) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({ id: subWp.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="border rounded p-4 bg-gray-50 dark:bg-gray-700 relative"
        >
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab"
            >
                <div className="font-semibold">{subWp.name}</div>
                {subWp.description && (
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {subWp.description}
                    </div>
                )}
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-2">
                    <span>優先級: {index + 1}</span>
                    <span>所屬: {subWp.workpackageName}</span>
                    <span>進度: {subWp.progress ?? 0}%</span>
                    {subWp.actualStartDate && <span>開始: {typeof subWp.actualStartDate === "string" ? subWp.actualStartDate : subWp.actualStartDate.toDate().toLocaleDateString()}</span>}
                    {subWp.actualEndDate && <span>完成: {typeof subWp.actualEndDate === "string" ? subWp.actualEndDate : subWp.actualEndDate.toDate().toLocaleDateString()}</span>}
                    <span>預估數量: {subWp.estimatedQuantity ?? '-'}</span>
                    <span>實際完成: {subWp.actualQuantity ?? '-'}</span>
                </div>
            </div>
            <button
                onClick={() => onEdit(subWp)}
                className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full hover:bg-blue-600 w-8 h-8 flex items-center justify-center"
                title="編輯"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            </button>
        </div>
    );
}

export default function SubWorkpackageSortingPage() {
    const params = useParams();
    const projectId = params?.project as string;
    const { db, doc, updateDoc, Timestamp } = useFirebase();
    const [projectDoc, loading] = useDocument(doc(db, "projects", projectId));
    const [saving, setSaving] = useState(false);
    const [workpackages, setWorkpackages] = useState<Workpackage[]>([]);
    const [allSubWorkpackages, setAllSubWorkpackages] = useState<EnhancedSubWorkpackage[]>([]);
    const [editingSubWp, setEditingSubWp] = useState<EnhancedSubWorkpackage | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<{
        actualStartDate: string;
        actualEndDate: string;
        estimatedQuantity: number;
        actualQuantity: number;
        progress: number;
    }>({
        actualStartDate: "",
        actualEndDate: "",
        estimatedQuantity: 0,
        actualQuantity: 0,
        progress: 0
    });

    const project = useMemo(() => {
        if (!projectDoc?.exists()) return null;
        return projectDoc.data();
    }, [projectDoc]);

    useEffect(() => {
        if (project?.workpackages) {
            setWorkpackages(project.workpackages);
            const allSubs: EnhancedSubWorkpackage[] = [];
            project.workpackages.forEach((wp: Workpackage) => {
                if (wp.subWorkpackages && wp.subWorkpackages.length > 0) {
                    wp.subWorkpackages.forEach((sub: SubWorkpackage) => {
                        allSubs.push({
                            ...sub,
                            workpackageId: wp.id,
                            workpackageName: wp.name
                        });
                    });
                }
            });
            setAllSubWorkpackages(allSubs);
        }
    }, [project]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = allSubWorkpackages.findIndex(item => item.id === active.id);
            const newIndex = allSubWorkpackages.findIndex(item => item.id === over.id);
            const newAllSubWorkpackages = arrayMove(allSubWorkpackages, oldIndex, newIndex);
            setAllSubWorkpackages(newAllSubWorkpackages);
            const updatedWorkpackages = [...workpackages];
            const subWpByWorkpackageId: Record<string, SubWorkpackage[]> = {};
            newAllSubWorkpackages.forEach((subWp, globalIndex) => {
                if (!subWpByWorkpackageId[subWp.workpackageId]) {
                    subWpByWorkpackageId[subWp.workpackageId] = [];
                }
                const { workpackageId, ...originalSubWp } = subWp;
                subWpByWorkpackageId[workpackageId].push({
                    ...originalSubWp,
                    priority: globalIndex
                });
            });
            updatedWorkpackages.forEach(wp => {
                if (subWpByWorkpackageId[wp.id]) {
                    wp.subWorkpackages = subWpByWorkpackageId[wp.id];
                }
            });
            setWorkpackages(updatedWorkpackages);
            saveToFirestore(updatedWorkpackages);
        }
    }

    const saveToFirestore = async (updatedWorkpackages: Workpackage[]) => {
        setSaving(true);
        try {
            await updateDoc(doc(db, "projects", projectId), {
                workpackages: updatedWorkpackages,
            });
        } catch {
            alert("更新排序時出錯，請重試。");
        } finally {
            setSaving(false);
        }
    };

    const startEditSubWorkpackage = (subWp: EnhancedSubWorkpackage) => {
        setEditingSubWp(subWp);
        setFormData({
            actualStartDate: subWp.actualStartDate
                ? (typeof subWp.actualStartDate === "string"
                    ? subWp.actualStartDate
                    : subWp.actualStartDate.toDate().toISOString().split('T')[0])
                : "",
            actualEndDate: subWp.actualEndDate
                ? (typeof subWp.actualEndDate === "string"
                    ? subWp.actualEndDate
                    : subWp.actualEndDate.toDate().toISOString().split('T')[0])
                : "",
            estimatedQuantity: subWp.estimatedQuantity || 0,
            actualQuantity: subWp.actualQuantity || 0,
            progress: subWp.progress || 0
        });
        setIsEditing(true);
    };

    const cancelEdit = () => {
        setEditingSubWp(null);
        setIsEditing(false);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const submitEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSubWp) return;
        // 將日期字串轉為 Timestamp
        const actualStartDate = formData.actualStartDate ? Timestamp.fromDate(new Date(formData.actualStartDate)) : undefined;
        const actualEndDate = formData.actualEndDate ? Timestamp.fromDate(new Date(formData.actualEndDate)) : undefined;
        const updatedSubWp: EnhancedSubWorkpackage = {
            ...editingSubWp,
            ...formData,
            actualStartDate,
            actualEndDate
        };
        setSaving(true);
        try {
            const newWorkpackages = workpackages.map(wp => {
                if (wp.id === updatedSubWp.workpackageId) {
                    return {
                        ...wp,
                        subWorkpackages: wp.subWorkpackages.map(sub =>
                            sub.id === updatedSubWp.id ? {
                                ...sub,
                                actualStartDate,
                                actualEndDate,
                                estimatedQuantity: formData.estimatedQuantity,
                                actualQuantity: formData.actualQuantity,
                                progress: formData.progress
                            } : sub
                        )
                    };
                }
                return wp;
            });
            setWorkpackages(newWorkpackages);
            const newAllSubWorkpackages = allSubWorkpackages.map(subWp =>
                subWp.id === updatedSubWp.id ? {
                    ...subWp,
                    actualStartDate,
                    actualEndDate,
                    estimatedQuantity: formData.estimatedQuantity,
                    actualQuantity: formData.actualQuantity,
                    progress: formData.progress
                } : subWp
            );
            setAllSubWorkpackages(newAllSubWorkpackages);
            await updateDoc(doc(db, "projects", projectId), {
                workpackages: newWorkpackages
            });
            setIsEditing(false);
            setEditingSubWp(null);
        } catch {
            alert("更新子工作包時出錯，請重試。");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4">載入中...</div>;
    if (!project) return <div className="p-4">找不到專案</div>;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h1 className="text-xl font-bold mb-4">子工作包排序</h1>
            <p className="mb-4 text-gray-600">拖曳子工作包來調整全域優先級。位置越靠上，優先級越高。</p>
            {allSubWorkpackages.length > 0 ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={allSubWorkpackages.map(subWp => subWp.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-2">
                            {allSubWorkpackages.map((subWp, index) => (
                                <SortableSubWorkpackage
                                    key={subWp.id}
                                    subWp={subWp}
                                    index={index}
                                    onEdit={startEditSubWorkpackage}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            ) : (
                <div className="text-center text-gray-500 py-8">
                    目前沒有子工作包
                </div>
            )}
            {saving && (
                <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow">
                    儲存中...
                </div>
            )}
            {isEditing && editingSubWp && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">編輯子工作包</h2>
                        <p className="text-sm text-gray-500 mb-4">{editingSubWp.name}</p>
                        <form onSubmit={submitEdit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">實際開始日期</label>
                                <input
                                    type="date"
                                    name="actualStartDate"
                                    value={formData.actualStartDate}
                                    onChange={handleFormChange}
                                    className="w-full border rounded p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300
                                               [&::-webkit-calendar-picker-indicator]:invert-0
                                               dark:[&::-webkit-calendar-picker-indicator]:invert"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">實際結束日期</label>
                                <input
                                    type="date"
                                    name="actualEndDate"
                                    value={formData.actualEndDate}
                                    onChange={handleFormChange}
                                    className="w-full border rounded p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300
                                               [&::-webkit-calendar-picker-indicator]:invert-0
                                               dark:[&::-webkit-calendar-picker-indicator]:invert"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">預估數量</label>
                                <input
                                    type="number"
                                    name="estimatedQuantity"
                                    value={formData.estimatedQuantity}
                                    onChange={handleFormChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full border rounded p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">實際完成數量</label>
                                <input
                                    type="number"
                                    name="actualQuantity"
                                    value={formData.actualQuantity}
                                    onChange={handleFormChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full border rounded p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">進度 (%)</label>
                                <input
                                    type="number"
                                    name="progress"
                                    value={formData.progress}
                                    onChange={handleFormChange}
                                    min="0"
                                    max="100"
                                    className="w-full border rounded p-2"
                                />
                            </div>
                            <div className="flex justify-end space-x-2 pt-4">
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="px-4 py-2 border border-gray-300 rounded shadow hover:bg-gray-200 hover:text-gray-900"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
                                    disabled={saving}
                                >
                                    {saving ? '儲存中...' : '確認儲存'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
