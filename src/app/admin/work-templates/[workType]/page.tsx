"use client";

import { app } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { useCollection, useDocument } from 'react-firebase-hooks/firestore';
import { useParams } from 'next/navigation';
import { useState } from 'react';

type Task = {
    id: string;
    name?: string;
    description?: string;
    flowId?: string;
    order?: number;
};

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
    const [editingFlowId, setEditingFlowId] = useState('');
    const [editingFlowName, setEditingFlowName] = useState('');

    // 任務
    const tasksRef = collection(db, 'work-templates', workTypeId, 'tasks');
    const [tasksSnap] = useCollection(query(tasksRef, orderBy('order', 'asc')));
    const [taskName, setTaskName] = useState('');
    const [taskDesc, setTaskDesc] = useState('');
    const [taskFlowId, setTaskFlowId] = useState('');
    const [taskOrder, setTaskOrder] = useState(1);
    const [taskMsg, setTaskMsg] = useState('');
    const [editingTaskId, setEditingTaskId] = useState('');
    const [editingTask, setEditingTask] = useState({ name: '', description: '', flowId: '', order: 1 });

    // 分頁狀態
    const [tab, setTab] = useState<'steps' | 'tasks'>('steps');

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
        await updateDoc(doc(db, 'work-templates', workTypeId, 'flows', id), { name: editingFlowName });
        setEditingFlowId('');
        setEditingFlowName('');
    };
    // 刪除流程
    const handleDeleteFlow = async (id: string) => {
        await deleteDoc(doc(db, 'work-templates', workTypeId, 'flows', id));
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
    // 編輯任務
    const handleEditTask = (task: Task) => {
        setEditingTaskId(task.id);
        setEditingTask({
            name: task.name || '',
            description: task.description || '',
            flowId: task.flowId || '',
            order: task.order || 1
        });
    };
    const handleSaveEditTask = async (id: string) => {
        await updateDoc(doc(db, 'work-templates', workTypeId, 'tasks', id), editingTask);
        setEditingTaskId('');
        setEditingTask({ name: '', description: '', flowId: '', order: 1 });
    };
    // 刪除任務
    const handleDeleteTask = async (id: string) => {
        await deleteDoc(doc(db, 'work-templates', workTypeId, 'tasks', id));
    };

    return (
        <div className="pb-20 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">{workTypeSnap?.data()?.name || '工作種類'}</h1>
            {/* 分頁切換 */}
            <div className="flex gap-4 border-b mb-6">
                <button
                    className={`px-4 py-2 -mb-px border-b-2 ${tab === 'steps' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-gray-500'}`}
                    onClick={() => setTab('steps')}
                >
                    步驟
                </button>
                <button
                    className={`px-4 py-2 -mb-px border-b-2 ${tab === 'tasks' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-gray-500'}`}
                    onClick={() => setTab('tasks')}
                >
                    任務
                </button>
            </div>
            {/* 分頁內容 */}
            {tab === 'steps' && (
                <>
                    <h2 className="text-lg font-semibold mb-2">施工流程</h2>
                    <form onSubmit={handleAddFlow} className="flex gap-2 mb-4">
                        <input className="border px-2 py-1" value={flowName} onChange={e => setFlowName(e.target.value)} placeholder="流程名稱" required />
                        <input className="border px-2 py-1 w-20" type="number" value={flowOrder} onChange={e => setFlowOrder(Number(e.target.value))} min={1} placeholder="順序" />
                        <button className="bg-blue-600 text-white px-3 py-1 rounded" type="submit">新增流程</button>
                    </form>
                    {flowMsg && <div className="text-green-700 mb-2">{flowMsg}</div>}
                    <ul className="space-y-2">
                        {flowsSnap?.docs.map(flow => (
                            <li key={flow.id} className="border p-2 rounded flex items-center gap-2">
                                {editingFlowId === flow.id ? (
                                    <>
                                        <input className="border px-2 py-1" value={editingFlowName} onChange={e => setEditingFlowName(e.target.value)} />
                                        <button className="text-xs bg-green-500 text-white px-2 py-1 rounded" onClick={() => handleSaveEditFlow(flow.id)}>儲存</button>
                                        <button className="text-xs bg-gray-300 px-2 py-1 rounded" onClick={() => setEditingFlowId('')}>取消</button>
                                    </>
                                ) : (
                                    <>
                                        <span className="flex-1">{flow.data().name}</span>
                                        <button className="text-xs text-blue-600 hover:underline" onClick={() => handleEditFlow(flow.id, flow.data().name)}>編輯</button>
                                        <button className="text-xs text-red-600 hover:underline" onClick={() => handleDeleteFlow(flow.id)}>刪除</button>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </>
            )}
            {tab === 'tasks' && (
                <>
                    <h2 className="text-lg font-semibold mb-2">任務</h2>
                    <form onSubmit={handleAddTask} className="flex gap-2 mb-4 flex-wrap">
                        <input className="border px-2 py-1" value={taskName} onChange={e => setTaskName(e.target.value)} placeholder="任務名稱" required />
                        <input className="border px-2 py-1" value={taskDesc} onChange={e => setTaskDesc(e.target.value)} placeholder="描述" />
                        <select className="border px-2 py-1" value={taskFlowId} onChange={e => setTaskFlowId(e.target.value)} required>
                            <option value="">選擇流程</option>
                            {flowsSnap?.docs.map(flow => (
                                <option key={flow.id} value={flow.id}>{flow.data().name}</option>
                            ))}
                        </select>
                        <input className="border px-2 py-1 w-20" type="number" value={taskOrder} onChange={e => setTaskOrder(Number(e.target.value))} min={1} placeholder="順序" />
                        <button className="bg-blue-600 text-white px-3 py-1 rounded" type="submit">新增任務</button>
                    </form>
                    {taskMsg && <div className="text-green-700 mb-2">{taskMsg}</div>}
                    <ul className="space-y-2">
                        {tasksSnap?.docs.map(task => (
                            <li key={task.id} className="border p-2 rounded flex items-center gap-2">
                                {editingTaskId === task.id ? (
                                    <>
                                        <input className="border px-2 py-1" value={editingTask.name} onChange={e => setEditingTask(t => ({ ...t, name: e.target.value }))} />
                                        <input className="border px-2 py-1" value={editingTask.description} onChange={e => setEditingTask(t => ({ ...t, description: e.target.value }))} />
                                        <select className="border px-2 py-1" value={editingTask.flowId} onChange={e => setEditingTask(t => ({ ...t, flowId: e.target.value }))} required>
                                            <option value="">選擇流程</option>
                                            {flowsSnap?.docs.map(flow => (
                                                <option key={flow.id} value={flow.id}>{flow.data().name}</option>
                                            ))}
                                        </select>
                                        <input className="border px-2 py-1 w-20" type="number" value={editingTask.order} onChange={e => setEditingTask(t => ({ ...t, order: Number(e.target.value) }))} min={1} />
                                        <button className="text-xs bg-green-500 text-white px-2 py-1 rounded" onClick={() => handleSaveEditTask(task.id)}>儲存</button>
                                        <button className="text-xs bg-gray-300 px-2 py-1 rounded" onClick={() => setEditingTaskId('')}>取消</button>
                                    </>
                                ) : (
                                    <>
                                        <span className="flex-1">{task.data().name}（{task.data().description}）</span>
                                        <span className="text-xs text-gray-500">流程：{flowsSnap?.docs.find(f => f.id === task.data().flowId)?.data().name || '—'}</span>
                                        <button className="text-xs text-blue-600 hover:underline" onClick={() => handleEditTask({ id: task.id, ...task.data() })}>編輯</button>
                                        <button className="text-xs text-red-600 hover:underline" onClick={() => handleDeleteTask(task.id)}>刪除</button>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}
