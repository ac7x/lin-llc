// src/app/admin/projects/[projectId]/tasks/page.tsx
"use client";

import { app } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// 工作類型介面定義
interface WorkType {
  id: string;
  name?: string;
  description?: string;
}

export default function ProjectFlowPage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  const [importing, setImporting] = useState(false);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [selectedWorkType, setSelectedWorkType] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState('');

  // 取得所有工作類型範本
  useEffect(() => {
    async function fetchWorkTypes() {
      const db = getFirestore(app);
      const snap = await getDocs(collection(db, 'templates'));
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

  // 匯入流程範本
  async function handleImportFlow() {
    if (!selectedWorkType || !selectedWorkspace) {
      setImportMsg('請選擇工作類型與工作區域');
      return;
    }
    setImporting(true);
    setImportMsg('');
    try {
      const db = getFirestore(app);
      // 取得流程範本
      const flowsSnap = await getDocs(collection(db, 'templates', selectedWorkType, 'flows'));
      if (flowsSnap.empty) {
        setImportMsg('該工作類型沒有流程可匯入');
        setImporting(false);
        return;
      }

      // 匯入流程
      for (const flowDoc of flowsSnap.docs) {
        const data = flowDoc.data();
        await addDoc(collection(db, 'projects', projectId, 'flows'), {
          name: data.name || '',
          order: data.order || 1,
          workspace: selectedWorkspace,
          importedFrom: selectedWorkType,
          importedAt: new Date()
        });
      }
      setImportMsg('流程匯入完成');
    } catch {
      setImportMsg('匯入失敗');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">專案流程管理</h2>
      <div className="border p-4 rounded bg-gray-50 mb-6">
        <h3 className="font-medium mb-3">從工作類型匯入流程</h3>
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
            <label className="block mb-1 text-sm">選擇工作類型</label>
            <select 
              className="border px-2 py-1 w-full" 
              value={selectedWorkType}
              onChange={e => setSelectedWorkType(e.target.value)}
            >
              <option value="">請選擇工作類型</option>
              {workTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleImportFlow}
            disabled={importing || !selectedWorkType || !selectedWorkspace}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
          >
            {importing ? '匯入中...' : '匯入流程'}
          </button>
          {importMsg && <div className="text-sm text-blue-600">{importMsg}</div>}
        </div>
      </div>
    </div>
  );
}
