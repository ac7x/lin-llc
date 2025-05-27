// src/app/admin/projects/[projectId]/tasks/page.tsx
"use client";

import { app } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type Task = {
  id: string;
  name?: string;
  assignee?: string;
  workspace?: string; // 新增 workspace 屬性
  // ...可擴充其他欄位
};

// workTypes 型別明確化
interface WorkType {
  id: string;
  name?: string;
  description?: string;
}

export default function ProjectTasksPage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  const db = getFirestore(app);
  const tasksRef = collection(db, `projects/${projectId}/tasks`);
  const [tasksSnap, loading, error] = useCollection(tasksRef);

  const [copying, setCopying] = useState(false);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [selectedWorkType, setSelectedWorkType] = useState('');
  const [copyMsg, setCopyMsg] = useState('');

  // 新增任務表單狀態
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskWorkspace, setTaskWorkspace] = useState('');

  // 取得所有範本種類
  useEffect(() => {
    async function fetchWorkTypes() {
      const db = getFirestore(app);
      const snap = await getDocs(collection(db, 'work-templates'));
      setWorkTypes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkType)));
    }
    fetchWorkTypes();
  }, []);

  // 取得所有工作區域
  const [workspaces, setWorkspaces] = useState<{id: string, name: string}[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  useEffect(() => {
    async function fetchWorkspaces() {
      const db = getFirestore(app);
      const snap = await getDocs(collection(db, 'projects', projectId, 'workspaces'));
      setWorkspaces(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name || doc.id })));
    }
    if (projectId) fetchWorkspaces();
  }, [projectId]);

  // 新增任務
  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskName || !taskWorkspace) return;
    await addDoc(collection(db, 'projects', projectId, 'tasks'), {
      name: taskName,
      description: taskDesc,
      workspace: taskWorkspace
    });
    setTaskName('');
    setTaskDesc('');
    setTaskWorkspace('');
  }

  // 複製範本任務到專案
  async function handleCopyTasks() {
    if (!selectedWorkType) return;
    setCopying(true);
    setCopyMsg('');
    try {
      const db = getFirestore(app);
      // 1. 複製 flows
      const flowsSnap = await getDocs(collection(db, 'work-templates', selectedWorkType, 'flows'));
      const flowIdMap: Record<string, string> = {};
      for (const flowDoc of flowsSnap.docs) {
        const data = flowDoc.data();
        // 讓使用者選擇工作區域
        const workspace = selectedWorkspace || '';
        const newFlowRef = await addDoc(collection(db, 'projects', projectId, 'flows'), {
          name: data.name || '',
          order: data.order || 1,
          workspace // 新增 workspace 欄位
        });
        flowIdMap[flowDoc.id] = newFlowRef.id;
      }
      // 2. 複製 tasks，flowId 需對應新 id
      const tasksSnap = await getDocs(collection(db, 'work-templates', selectedWorkType, 'tasks'));
      if (tasksSnap.empty) {
        setCopyMsg('該範本沒有任務可複製');
        setCopying(false);
        return;
      }
      const batch = tasksSnap.docs.map(docSnap => {
        const data = docSnap.data();
        let newFlowId = data.flowId;
        if (newFlowId && flowIdMap[newFlowId]) {
          newFlowId = flowIdMap[newFlowId];
        }
        // 讓使用者選擇工作區域
        const workspace = selectedWorkspace || '';
        return addDoc(collection(db, 'projects', projectId, 'tasks'), {
          name: data.name || '',
          description: data.description || '',
          flowId: newFlowId || '',
          order: data.order || 1,
          workspace // 新增 workspace 欄位
        });
      });
      await Promise.all(batch);
      setCopyMsg('任務與流程複製完成');
    } catch {
      setCopyMsg('複製失敗');
    } finally {
      setCopying(false);
    }
  }

  if (loading) return <div>載入中...</div>;
  if (error) return <div>發生錯誤: {error.message}</div>;

  const tasks: Task[] = tasksSnap
    ? tasksSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Task, 'id'>) }))
    : [];

  // 過濾任務
  const filteredTasks = selectedWorkspace
    ? tasks.filter(task => task.workspace === selectedWorkspace)
    : tasks;

  return (
    <div>
      <h2 className="text-xl font-bold">任務列表</h2>
      {/* 新增任務表單 */}
      <form onSubmit={handleAddTask} className="mb-4 flex gap-2 flex-wrap items-end">
        <input
          className="border px-2 py-1"
          value={taskName}
          onChange={e => setTaskName(e.target.value)}
          placeholder="任務名稱"
          required
        />
        <input
          className="border px-2 py-1"
          value={taskDesc}
          onChange={e => setTaskDesc(e.target.value)}
          placeholder="描述"
        />
        <select
          className="border px-2 py-1"
          value={taskWorkspace}
          onChange={e => setTaskWorkspace(e.target.value)}
          required
        >
          <option value="">選擇工作區域</option>
          {workspaces.map(ws => (
            <option key={ws.id} value={ws.id}>{ws.name}</option>
          ))}
        </select>
        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">新增任務</button>
      </form>
      {/* 工作區域過濾選單 */}
      <div className="mb-4 flex items-center gap-2">
        <select
          className="border px-2 py-1"
          value={selectedWorkspace}
          onChange={e => setSelectedWorkspace(e.target.value)}
        >
          <option value="">全部工作區域</option>
          {workspaces.map(ws => (
            <option key={ws.id} value={ws.id}>{ws.name}</option>
          ))}
        </select>
        {/* 原本的範本選單與複製按鈕 */}
        <select
          className="border px-2 py-1"
          value={selectedWorkType}
          onChange={e => setSelectedWorkType(e.target.value)}
        >
          <option value="">選擇範本種類</option>
          {workTypes.map(wt => (
            <option key={wt.id} value={wt.id}>{wt.name || wt.id}</option>
          ))}
        </select>
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded"
          onClick={handleCopyTasks}
          disabled={!selectedWorkType || copying}
        >
          {copying ? '複製中...' : '從範本複製任務'}
        </button>
        {copyMsg && <span className="text-green-700 ml-2">{copyMsg}</span>}
      </div>
      {filteredTasks.length === 0 ? (
        <p>尚未有任務。</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {filteredTasks.map(task => (
            <li key={task.id}>
              <div className="p-2 border rounded">
                <p className="font-semibold">{task.name ?? '(未命名任務)'}</p>
                <p>負責人：{task.assignee ?? '(未指定)'}</p>
                <p className="text-xs text-gray-500">工作區域：{task.workspace || '—'}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
