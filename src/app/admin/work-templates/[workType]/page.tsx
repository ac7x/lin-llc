"use client";

import { app } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { useCollection, useDocument } from 'react-firebase-hooks/firestore';
import { useParams } from 'next/navigation';
import React, { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
    const workTypeId = params?.workType as string;
    const db = getFirestore(app);
    const workTypeRef = doc(db, 'templates', workTypeId);
    const [workTypeSnap] = useDocument(workTypeRef);

    // 流程
    const flowsRef = collection(db, 'templates', workTypeId, 'flows');
    const [flowsSnap] = useCollection(query(flowsRef, orderBy('order', 'asc')));
    const [flows, setFlows] = useState<Flow[]>([]);
    const [flowName, setFlowName] = useState('');
    const [flowOrder, setFlowOrder] = useState(1);
    const [flowMsg, setFlowMsg] = useState('');
    const [editingFlowId, setEditingFlowId] = useState('');
    const [editingFlowName, setEditingFlowName] = useState('');

    // flowsSnap 變動時同步本地 flows 狀態
    React.useEffect(() => {
        if (flowsSnap) {
            setFlows(flowsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Flow, 'id'>) })));
        }
    }, [flowsSnap]);

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
    // 編輯流程
    const handleEditFlow = (id: string, name: string) => {
        setEditingFlowId(id);
        setEditingFlowName(name);
    };
    const handleSaveEditFlow = async (id: string) => {
        await updateDoc(doc(db, 'templates', workTypeId, 'flows', id), { name: editingFlowName });
        setEditingFlowId('');
        setEditingFlowName('');
    };
    // 刪除流程
    const handleDeleteFlow = async (id: string) => {
        await deleteDoc(doc(db, 'templates', workTypeId, 'flows', id));
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
        // 批次更新 Firestore
        for (const f of newFlows) {
            await updateDoc(doc(db, 'templates', workTypeId, 'flows', f.id), { order: f.order });
        }
    };

    return (
        <div className="pb-20 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">{workTypeSnap?.data()?.name || '工作種類'}</h1>
            {/* 施工流程管理 */}
            <h2 className="text-lg font-semibold mt-6 mb-2">施工流程</h2>
            <form onSubmit={handleAddFlow} className="flex gap-2 mb-4">
                <input className="border px-2 py-1" value={flowName} onChange={e => setFlowName(e.target.value)} placeholder="流程名稱" required />
                <input className="border px-2 py-1 w-20" type="number" value={flowOrder} onChange={e => setFlowOrder(Number(e.target.value))} min={1} placeholder="順序" />
                <button className="bg-blue-600 text-white px-3 py-1 rounded" type="submit">新增</button>
            </form>
            {flowMsg && <div className="text-green-700 mb-2">{flowMsg}</div>}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={flows.map(f => f.id)} strategy={verticalListSortingStrategy}>
                    <ul className="space-y-2">
                        {flows.map(flow => (
                            <SortableFlowItem
                                key={flow.id}
                                id={flow.id}
                                name={editingFlowId === flow.id ? '' : flow.name}
                                editing={editingFlowId === flow.id}
                                editingName={editingFlowName}
                                onEdit={() => handleEditFlow(flow.id, flow.name)}
                                onSave={() => handleSaveEditFlow(flow.id)}
                                onChange={setEditingFlowName}
                                onDelete={() => handleDeleteFlow(flow.id)}
                            />
                        ))}
                    </ul>
                </SortableContext>
            </DndContext>
        </div>
    );
}
