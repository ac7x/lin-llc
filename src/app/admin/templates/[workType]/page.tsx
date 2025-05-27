"use client";

import { app } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { useCollection, useDocument } from 'react-firebase-hooks/firestore';
import { useParams } from 'next/navigation';
import React, { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { QuerySnapshot, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

type Flow = {
    id: string;
    name: string;
    order: number;
};

type SortableFlowItemProps = {
    id: string;
    name: string;
    editing: boolean;
    editingName: string;
    onEdit: () => void;
    onSave: () => void;
    onChange: (v: string) => void;
    onDelete: () => void;
};

function SortableFlowItem({ id, name, editing, editingName, onEdit, onSave, onChange, onDelete }: SortableFlowItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        background: isDragging ? '#f3f4f6' : undefined
    };
    return (
        <li ref={setNodeRef} style={style} className="border p-2 rounded flex items-center gap-2 bg-white">
            <span {...attributes} {...listeners} className="cursor-move text-gray-400 select-none pr-2">☰</span>
            {editing ? (
                <>
                    <input
                        className="border px-2 py-1 flex-1"
                        value={editingName}
                        onChange={e => onChange(e.target.value)}
                        autoFocus
                    />
                    <button className="text-blue-600 px-2" onClick={onSave}>儲存</button>
                </>
            ) : (
                <>
                    <span className="flex-1">{name}</span>
                    <button className="text-yellow-600 px-2" onClick={onEdit}>編輯</button>
                    <button className="text-red-600 px-2" onClick={onDelete}>刪除</button>
                </>
            )}
        </li>
    );
}

export default function WorkTypeDetailPage() {
    const params = useParams();
    const TypeId = params?.workType as string;
    const db = getFirestore(app);
    const workTypeRef = doc(db, 'templates', TypeId);
    const [workTypeSnap] = useDocument(workTypeRef);

    // 流程
    const flowsRef = collection(db, 'templates', TypeId, 'flows');
    const [flowsSnap] = useCollection(query(flowsRef, orderBy('order', 'asc')));
    const [flows, setFlows] = useState<Flow[]>([]);
    const [flowName, setFlowName] = useState('');
    const [flowMsg, setFlowMsg] = useState('');
    const [editingFlowId, setEditingFlowId] = useState('');
    const [editingFlowName, setEditingFlowName] = useState('');

    // 複製流程到專案區域
    const projectsRef = collection(db, "projects");
    const [projectsSnap] = useCollection(projectsRef);
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [areasSnap, setAreasSnap] = useState<QuerySnapshot<DocumentData> | null>(null);
    const [selectedAreaId, setSelectedAreaId] = useState("");
    const [copyMsg, setCopyMsg] = useState("");
    const [copying, setCopying] = useState(false);

    // 新增：複製流程選擇狀態
    const [selectedFlowIds, setSelectedFlowIds] = useState<string[]>([]);

    // flowsSnap 變動時同步本地 flows 狀態
    React.useEffect(() => {
        if (flowsSnap) {
            // 先將資料依 order 排序，order 缺失時放最後
            const flowsList = flowsSnap.docs.map(doc => {
                const data = doc.data() as Omit<Flow, 'id'>;
                return {
                    id: doc.id,
                    name: data.name,
                    order: typeof data.order === 'number' ? data.order : 9999,
                };
            });
            flowsList.sort((a, b) => a.order - b.order);
            setFlows(flowsList);
            // 預設全選
            setSelectedFlowIds(flowsList.map(f => f.id));
        }
    }, [flowsSnap]);

    // 新增流程
    const handleAddFlow = async (e: React.FormEvent) => {
        e.preventDefault();
        setFlowMsg('');
        try {
            // 直接從 flowsSnap.docs 計算最大 order
            let maxOrder = 0;
            if (flowsSnap && flowsSnap.docs.length > 0) {
                maxOrder = Math.max(
                    ...flowsSnap.docs.map(doc => {
                        const data = doc.data() as { order?: number };
                        return typeof data.order === 'number' ? data.order : 0;
                    })
                );
            }
            await addDoc(flowsRef, {
                name: flowName,
                order: maxOrder + 1
            });
            setFlowName('');
            setFlowMsg('新增成功');
        } catch {
            setFlowMsg('新增失敗');
        }
    };
    // 編輯流程
    const handleEditFlow = (id: string, name: string) => {
        setEditingFlowId(id);
        setEditingFlowName(name);
    };
    const handleSaveEditFlow = async (id: string) => {
        await updateDoc(doc(db, 'templates', TypeId, 'flows', id), { name: editingFlowName });
        setEditingFlowId('');
        setEditingFlowName('');
    };
    // 刪除流程 });
    const handleDeleteFlow = async (id: string) => {
        await deleteDoc(doc(db, 'templates', TypeId, 'flows', id));
    };

    // dnd-kit sensors
    const sensors = useSensors(useSensor(PointerSensor));

    // 拖曳結束時更新順序
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = flows.findIndex(f => f.id === active.id);
        const newIndex = flows.findIndex(f => f.id === over.id);
        const newFlows = arrayMove(flows, oldIndex, newIndex).map((f, idx) => ({ ...f, order: idx + 1 }));
        setFlows(newFlows);
        // 同步 selectedFlowIds 順序
        setSelectedFlowIds(ids => {
            // 只針對已選中的流程調整順序
            const selectedFlows = newFlows.filter(f => ids.includes(f.id)).map(f => f.id);
            return selectedFlows;
        });
        // 批次更新 Firestore
        for (const f of newFlows) {
            await updateDoc(doc(db, 'templates', TypeId, 'flows', f.id), { order: f.order });
        }
    };

    // 當選擇專案時，載入該專案的區域
    async function handleProjectChange(projectId: string) {
        setSelectedProjectId(projectId);
        setSelectedAreaId("");
        setAreasSnap(null);
        if (!projectId) return;
        const areasRef = collection(db, "projects", projectId, "areas");
        const snap = await getDocs(areasRef);
        setAreasSnap(snap);
    }

    // 勾選流程
    function handleToggleFlow(flowId: string) {
        setSelectedFlowIds(ids =>
            ids.includes(flowId) ? ids.filter(id => id !== flowId) : [...ids, flowId]
        );
    }

    // 全選/全不選
    function handleToggleAllFlows() {
        if (selectedFlowIds.length === flows.length) {
            setSelectedFlowIds([]);
        } else {
            setSelectedFlowIds(flows.map(f => f.id));
        }
    }

    // 複製 flows 到指定專案區域（只複製已選中的流程，順序依照 selectedFlowIds）
    async function handleCopyFlowsToArea() {
        if (!selectedProjectId || !selectedAreaId) return;
        setCopyMsg("");
        setCopying(true);
        try {
            // 依照 selectedFlowIds 順序取得流程
            const flowsToCopy = flows.filter(f => selectedFlowIds.includes(f.id));
            const tasksRef = collection(db, "projects", selectedProjectId, "areas", selectedAreaId, "tasks");
            for (let i = 0; i < flowsToCopy.length; i++) {
                const flow = flowsToCopy[i];
                await addDoc(tasksRef, {
                    name: flow.name,
                    order: i + 1,
                    status: "pending",
                });
            }
            setCopyMsg("流程已複製到專案區域！");
        } catch {
            setCopyMsg("複製失敗");
        }
        setCopying(false);
    }

    return (
        <div className="pb-20 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">{workTypeSnap?.data()?.name || '工作種類'}</h1>
            {/* 施工流程管理 */}
            <h2 className="text-lg font-semibold mt-6 mb-2">施工流程</h2>
            <form onSubmit={handleAddFlow} className="flex gap-2 mb-4">
                <input className="border px-2 py-1 flex-1" value={flowName} onChange={e => setFlowName(e.target.value)} placeholder="流程名稱" required />
                <button className="bg-blue-600 text-white px-3 py-1 rounded" type="submit">新增</button>
            </form>
            {flowMsg && <div className="text-green-700 mb-2">{flowMsg}</div>}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={flows.map(f => f.id)} strategy={verticalListSortingStrategy}>
                    <ul className="space-y-2">
                        {flows.map(flow => (
                            <li key={flow.id} className="flex items-center gap-2">
                                {/* 新增：複製選擇用 checkbox */}
                                <input
                                    type="checkbox"
                                    checked={selectedFlowIds.includes(flow.id)}
                                    onChange={() => handleToggleFlow(flow.id)}
                                    className="accent-blue-600"
                                    title="選擇要複製"
                                />
                                <SortableFlowItem
                                    id={flow.id}
                                    name={editingFlowId === flow.id ? '' : flow.name}
                                    editing={editingFlowId === flow.id}
                                    editingName={editingFlowName}
                                    onEdit={() => handleEditFlow(flow.id, flow.name)}
                                    onSave={() => handleSaveEditFlow(flow.id)}
                                    onChange={setEditingFlowName}
                                    onDelete={() => handleDeleteFlow(flow.id)}
                                />
                            </li>
                        ))}
                    </ul>
                </SortableContext>
            </DndContext>
            {/* 複製流程到專案區域 */}
            <div className="border p-4 my-8 rounded bg-gray-50">
                <div className="font-bold mb-2">複製本範本流程到專案區域</div>
                {/* 新增：全選/全不選按鈕 */}
                <button
                    className="text-blue-600 underline text-sm mb-2"
                    type="button"
                    onClick={handleToggleAllFlows}
                >
                    {selectedFlowIds.length === flows.length ? "全不選" : "全選全部流程"}
                </button>
                <div className="mb-2 text-sm text-gray-600">
                    已選 {selectedFlowIds.length} / {flows.length} 個流程，拖曳可調整複製順序
                </div>
                <div className="mb-2">
                    <label>選擇專案：</label>
                    <select value={selectedProjectId} onChange={e => handleProjectChange(e.target.value)} className="border px-2 py-1 rounded">
                        <option value="">請選擇</option>
                        {projectsSnap?.docs.map(doc => (
                            <option key={doc.id} value={doc.id}>{doc.data().name || doc.id}</option>
                        ))}
                    </select>
                </div>
                {areasSnap && (
                    <div className="mb-2">
                        <label>選擇區域：</label>
                        <select value={selectedAreaId} onChange={e => setSelectedAreaId(e.target.value)} className="border px-2 py-1 rounded">
                            <option value="">請選擇</option>
                            {areasSnap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => (
                                <option key={doc.id} value={doc.id}>{doc.data().name || doc.id}</option>
                            ))}
                        </select>
                    </div>
                )}
                <button
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                    onClick={handleCopyFlowsToArea}
                    disabled={!selectedProjectId || !selectedAreaId || copying || selectedFlowIds.length === 0}
                >
                    {copying ? "複製中..." : "複製流程"}
                </button>
                {copyMsg && <div className="mt-2 text-green-700">{copyMsg}</div>}
            </div>
        </div>
    );
}
