// src/app/admin/projects/[projectId]/tasks/page.tsx
"use client";

import { app } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// workTypes 型別明確化
interface WorkType {
  id: string;
  name?: string;
  description?: string;
}

export default function ProjectTasksPage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  const [copying, setCopying] = useState(false);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [selectedWorkType, setSelectedWorkType] = useState('');
  const [copyMsg, setCopyMsg] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState('');

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
  useEffect(() => {
    async function fetchWorkspaces() {
      const db = getFirestore(app);
      const snap = await getDocs(collection(db, 'projects', projectId, 'workspaces'));
      setWorkspaces(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name || doc.id })));
    }
    if (projectId) fetchWorkspaces();
  }, [projectId]);

  // 複製範本流程到專案
  async function handleCopyFlows() {
    if (!selectedWorkType || !selectedWorkspace) {
      setCopyMsg('請選擇工作類型與工作區域');
      return;
    }
    setCopying(true);
    setCopyMsg('');
    try {
      const db = getFirestore(app);
      // 複製 flows
      const flowsSnap = await getDocs(collection(db, 'work-templates', selectedWorkType, 'flows'));
      if (flowsSnap.empty) {
        setCopyMsg('該範本沒有流程可複製');
        setCopying(false);
        return;
      }

      for (const flowDoc of flowsSnap.docs) {
        const data = flowDoc.data();
        await addDoc(collection(db, 'projects', projectId, 'flows'), {
          name: data.name || '',
          order: data.order || 1,
          workspace: selectedWorkspace
        });
      }
      setCopyMsg('流程複製完成');
    } catch {
      setCopyMsg('複製失敗');
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">專案施工流程設定</h2>
      <div className="border p-4 rounded bg-gray-50 mb-6">
        <h3 className="font-medium mb-3">從施工種類複製流程</h3>
        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-sm">選擇工作區域</label>
            <select 
              className="border px-2 py-1 w-full" 
              value={selectedWorkspace}
              onChange={e => setSelectedWorkspace(e.target.value)}
            >
              <option value="">請選擇工作區域</option>
              {workspaces.map(ws => (
                <option key={ws.id} value={ws.id}>{ws.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm">選擇施工種類</label>
            <select 
              className="border px-2 py-1 w-full" 
              value={selectedWorkType}
              onChange={e => setSelectedWorkType(e.target.value)}
            >
              <option value="">請選擇施工種類</option>
              {workTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCopyFlows}
            disabled={copying || !selectedWorkType || !selectedWorkspace}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
          >
            {copying ? '複製中...' : '複製流程'}
          </button>
          {copyMsg && <div className="text-sm text-blue-600">{copyMsg}</div>}
        </div>
      </div>
    </div>
  );
}
