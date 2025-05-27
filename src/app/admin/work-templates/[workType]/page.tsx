"use client";

import { app } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { getFirestore, doc, collection, addDoc, query, orderBy, updateDoc, deleteDoc } from 'firebase/firestore';
import { useDocument, useCollection } from 'react-firebase-hooks/firestore';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import React from 'react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: 'grab',
    };
    return (
        <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </li>
    );
}

export default function WorkTypeDetailPage() {
    const params = useParams();
    const workTypeId = params?.workType as string;
    const db = getFirestore(app);
    const workTypeRef = doc(db, 'work-templates', workTypeId);
    const [workTypeSnap] = useDocument(workTypeRef);

    // 流程
    const flowsRef = collection(db, 'work-templates', workTypeId, 'flows');
    const [flowsSnap] = useCollection(query(flowsRef, orderBy('order', 'asc')));
    const [flowName, setFlowName] = useState('');
    const [flowOrder, setFlowOrder] = useState(1);
    const [flowMsg, setFlowMsg] = useState('');

    // 任務
    const tasksRef = collection(db, 'work-templates', workTypeId, 'tasks');
    const [tasksSnap] = useCollection(query(tasksRef, orderBy('order', 'asc')));
    const [taskName, setTaskName] = useState('');
    const [taskDesc, setTaskDesc] = useState('');
    const [taskFlowId, setTaskFlowId] = useState('');
    const [taskOrder, setTaskOrder] = useState(1);
    const [taskMsg, setTaskMsg] = useState('');

    // 編輯流程狀態
    const [editingFlowId, setEditingFlowId] = useState('');
    const [editingFlowName, setEditingFlowName] = useState('');
    // 拖曳排序狀態
    const [flowOrderList, setFlowOrderList] = useState<string[]>([]);

    // flowsSnap 變動時同步排序陣列
    React.useEffect(() => {
        if (flowsSnap?.docs) {
            setFlowOrderList(flowsSnap.docs.map(doc => doc.id));
        }
    }, [flowsSnap]);

    // 拖曳 sensors
    const sensors = useSensors(useSensor(PointerSensor));

    // 拖曳排序處理
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;
        if (active.id !== over.id) {
            const oldIndex = flowOrderList.indexOf(active.id as string);
            const newIndex = flowOrderList.indexOf(over.id as string);
            const newOrder = arrayMove(flowOrderList, oldIndex, newIndex);
            setFlowOrderList(newOrder);
            // 更新 Firestore order 欄位
            for (let i = 0; i < newOrder.length; i++) {
                const docRef = doc(db, 'work-templates', workTypeId, 'flows', newOrder[i]);
                await updateDoc(docRef, { order: i + 1 });
            }
        }
    };

    // 編輯流程
    const handleEditFlow = (id: string, name: string) => {
        setEditingFlowId(id);
        setEditingFlowName(name);
    };
    const handleSaveEditFlow = async (id: string) => {
        await updateDoc(doc(db, 'work-templates', workTypeId, 'flows', id), { name: editingFlowName });
        setEditingFlowId('');
        setEditingFlowName('');
    };
    // 刪除流程
    const handleDeleteFlow = async (id: string) => {
        await deleteDoc(doc(db, 'work-templates', workTypeId, 'flows', id));
    };

    // 新增流程
    const handleAddFlow = async (e: React.FormEvent) => {
        e.preventDefault();
        setFlowMsg('');
        try {
            await addDoc(flowsRef, { name: flowName, order: flowOrder });
            setFlowName('');
            setFlowOrder(1);
            setFlowMsg('新增成功');
        } catch {
            setFlowMsg('新增失敗');
        }
    };

    // 新增任務
    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setTaskMsg('');
        try {
            await addDoc(tasksRef, { name: taskName, description: taskDesc, flowId: taskFlowId, order: taskOrder });
            setTaskName('');
            setTaskDesc('');
            setTaskFlowId('');
            setTaskOrder(1);
            setTaskMsg('新增成功');
        } catch {
            setTaskMsg('新增失敗');
        }
    };

    return (
        <div className="pb-20 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">{workTypeSnap?.data()?.name || '工作種類'}</h1>
            <h2 className="text-lg font-semibold mt-6 mb-2">工作流程</h2>
            <form onSubmit={handleAddFlow} className="flex gap-2 mb-4">
                <input className="border px-2 py-1" value={flowName} onChange={e => setFlowName(e.target.value)} placeholder="流程名稱" required />
                <input className="border px-2 py-1 w-20" type="number" value={flowOrder} onChange={e => setFlowOrder(Number(e.target.value))} min={1} placeholder="順序" />
                <button className="bg-blue-600 text-white px-3 py-1 rounded" type="submit">新增流程</button>
            </form>
            {flowMsg && <div className="text-green-700 mb-2">{flowMsg}</div>}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={flowOrderList} strategy={verticalListSortingStrategy}>
                    <ul className="mb-6">
                        {flowOrderList.map(id => {
                            const docObj = flowsSnap?.docs.find(d => d.id === id);
                            if (!docObj) return null;
                            const data = docObj.data();
                            return (
                                <SortableItem key={id} id={id}>
                                    {editingFlowId === id ? (
                                        <div className="flex gap-2 items-center">
                                            <input className="border px-2 py-1" value={editingFlowName} onChange={e => setEditingFlowName(e.target.value)} />
                                            <button className="bg-green-600 text-white px-2 py-1 rounded" onClick={() => handleSaveEditFlow(id)} type="button">儲存</button>
                                            <button className="bg-gray-400 text-white px-2 py-1 rounded" onClick={() => setEditingFlowId('')} type="button">取消</button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 items-center">
                                            <span className="cursor-move">☰</span>
                                            <span>{data.order}. {data.name}</span>
                                            <button className="text-blue-600 underline text-xs" onClick={() => handleEditFlow(id, data.name)} type="button">編輯</button>
                                            <button className="text-red-600 underline text-xs" onClick={() => handleDeleteFlow(id)} type="button">刪除</button>
                                        </div>
                                    )}
                                </SortableItem>
                            );
                        })}
                    </ul>
                </SortableContext>
            </DndContext>

            <h2 className="text-lg font-semibold mt-6 mb-2">工作任務</h2>
            <form onSubmit={handleAddTask} className="space-y-2 mb-4">
                <div className="flex gap-2">
                    <input className="border px-2 py-1" value={taskName} onChange={e => setTaskName(e.target.value)} placeholder="任務名稱" required />
                    <input className="border px-2 py-1 w-20" type="number" value={taskOrder} onChange={e => setTaskOrder(Number(e.target.value))} min={1} placeholder="順序" />
                </div>
                <textarea className="border px-2 py-1 w-full" value={taskDesc} onChange={e => setTaskDesc(e.target.value)} placeholder="任務描述" />
                <select className="border px-2 py-1 w-full" value={taskFlowId} onChange={e => setTaskFlowId(e.target.value)} required>
                    <option value="">選擇流程</option>
                    {flowsSnap?.docs.map(doc => (
                        <option key={doc.id} value={doc.id}>{doc.data().name}</option>
                    ))}
                </select>
                <button className="bg-blue-600 text-white px-3 py-1 rounded" type="submit">新增任務</button>
            </form>
            {taskMsg && <div className="text-green-700 mb-2">{taskMsg}</div>}
            <ul>
                {tasksSnap?.docs.map(doc => {
                    const t = doc.data();
                    const flow = flowsSnap?.docs.find(f => f.id === t.flowId);
                    return (
                        <li key={doc.id} className="mb-2 border p-2 rounded">
                            <div className="font-semibold">{t.order}. {t.name}</div>
                            <div className="text-sm text-gray-600">{t.description}</div>
                            <div className="text-xs text-gray-500">流程：{flow?.data().name || '—'}</div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
