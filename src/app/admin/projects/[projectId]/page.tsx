"use client";

import { app } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { getFirestore, collection, query, orderBy, addDoc, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { useParams } from "next/navigation";
import { useState } from "react";
import React from "react";
import { useRouter } from "next/navigation";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const db = getFirestore(app);
  const tasksRef = collection(db, "projects", projectId, "tasks");
  const [tasksSnap] = useCollection(query(tasksRef, orderBy("order", "asc")));

  // 區域相關 state
  const [areaName, setAreaName] = useState("");
  const [areaMsg, setAreaMsg] = useState("");
  const [addingArea, setAddingArea] = useState(false);
  const areasRef = collection(db, "projects", projectId, "areas");
  const [areasSnap] = useCollection(areasRef);

  // 新增：區域 tasks 狀態
  type AreaTask = {
    id: string;
    name: string;
    status?: string;
    order?: number;
    quantity?: number; // <--- 新增這一行
    // 其他欄位可依需求擴充
  };

  const [areaTasks, setAreaTasks] = useState<{ [areaId: string]: AreaTask[] }>({});

  // 新增：載入每個區域的 tasks
  React.useEffect(() => {
    async function fetchAreaTasks() {
      if (!areasSnap) return;
      const result: { [areaId: string]: AreaTask[] } = {};
      for (const areaDoc of areasSnap.docs) {
        const tasksRef = collection(db, "projects", projectId, "areas", areaDoc.id, "tasks");
        const tasksSnap = await getDocs(tasksRef);
        result[areaDoc.id] = tasksSnap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<AreaTask, "id">)
        }));
      }
      setAreaTasks(result);
    }
    fetchAreaTasks();
  }, [areasSnap, db, projectId]);

  // 新增區域並複製 flows
  async function handleAddArea(e: React.FormEvent) {
    e.preventDefault();
    setAreaMsg("");
    try {
      // 取得專案名稱
      const projectDoc = await getDoc(doc(db, "projects", projectId));
      const projectName = projectDoc.exists() ? projectDoc.data().name : "";
      // name: 專案名稱-區域名稱
      const areaFullName = `${projectName}-${areaName}`;
      await addDoc(areasRef, { name: areaFullName, createdAt: new Date() });
      setAreaMsg("新增成功");
      setAreaName("");
      setAddingArea(false);
    } catch {
      setAreaMsg("新增失敗");
    }
  }

  const router = useRouter();

  // 取得專案資訊
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  React.useEffect(() => {
    async function fetchProject() {
      const projectDoc = await getDoc(doc(db, "projects", projectId));
      if (projectDoc.exists()) {
        setProjectName(projectDoc.data().name || "");
        setProjectDesc(projectDoc.data().description || "");
      }
    }
    if (projectId) fetchProject();
  }, [db, projectId]);

  // 新增：追蹤每個區域任務的數量編輯狀態
  const [editQuantities, setEditQuantities] = useState<{ [taskId: string]: number | "" }>({});
  const [savingQuantity, setSavingQuantity] = useState<{ [taskId: string]: boolean }>({});

  // 新增：儲存數量
  async function handleSaveQuantity(areaId: string, taskId: string) {
    const value = editQuantities[taskId];
    if (value === "" || isNaN(Number(value))) return;
    setSavingQuantity(s => ({ ...s, [taskId]: true }));
    try {
      await updateDoc(
        doc(db, "projects", projectId, "areas", areaId, "tasks", taskId),
        { quantity: Number(value) }
      );
    } catch {
      // 可加錯誤提示
    }
    setSavingQuantity(s => ({ ...s, [taskId]: false }));
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">專案詳細頁</h1>
      <div>專案 ID: {projectId}</div>
      {/* 專案資訊區塊 */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">{projectName}</span>
          <button
            className="text-blue-600 underline"
            onClick={() => router.push(`/admin/projects/${projectId}/edit`)}
            type="button"
          >
            編輯
          </button>
        </div>
        <div className="text-gray-600">{projectDesc}</div>
      </div>
      <h2 className="text-lg font-semibold mt-6 mb-2">任務清單</h2>
      <ul className="space-y-2">
        {tasksSnap?.docs.length === 0 && <li className="text-gray-500">尚無任務</li>}
        {tasksSnap?.docs.map(doc => (
          <li key={doc.id} className="border p-2 rounded flex items-center gap-2">
            <span className="flex-1">{doc.data().name}</span>
            <span className="text-xs text-gray-500">{doc.data().status === "done" ? "✅ 已完成" : "⏳ 未完成"}</span>
          </li>
        ))}
      </ul>

      {/* 區域管理 */}
      <h2 className="text-lg font-semibold mt-8 mb-2">區域管理</h2>
      <button
        className="bg-blue-600 text-white px-3 py-1 rounded mb-3"
        onClick={() => setAddingArea(v => !v)}
        type="button"
      >
        {addingArea ? "取消" : "新增區域"}
      </button>
      {addingArea && (
        <form onSubmit={handleAddArea} className="flex gap-2 mb-4">
          <input
            className="border px-2 py-1 flex-1"
            value={areaName}
            onChange={e => setAreaName(e.target.value)}
            placeholder="區域名稱"
            required
          />
          <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded">儲存</button>
        </form>
      )}
      {areaMsg && <div className="text-green-700 mb-2">{areaMsg}</div>}
      <ul className="space-y-2">
        {areasSnap?.docs.length === 0 && <li className="text-gray-500">尚無區域</li>}
        {areasSnap?.docs.map(doc => (
          <li key={doc.id} className="border p-2 rounded flex flex-col gap-2">
            <span className="flex-1">{doc.data().name}</span>
            {/* 新增：顯示該區域的 tasks */}
            <ul className="ml-4 mt-1 space-y-1">
              {areaTasks[doc.id]?.length === 0 && (
                <li className="text-xs text-gray-400">（無任務）</li>
              )}
              {areaTasks[doc.id]?.map(task => (
                <li key={task.id} className="text-xs flex gap-2 items-center">
                  <span>{task.name}</span>
                  <span className="text-gray-400">{task.status === "done" ? "✅ 已完成" : "⏳ 未完成"}</span>
                  {/* 新增：數量編輯 */}
                  <span>
                    數量：
                    <input
                      type="number"
                      min={0}
                      className="border px-1 w-16 text-xs"
                      value={
                        editQuantities[task.id] !== undefined
                          ? editQuantities[task.id]
                          : (typeof task.quantity === "number" ? task.quantity : "")
                      }
                      onChange={e =>
                        setEditQuantities(q => ({
                          ...q,
                          [task.id]: e.target.value === "" ? "" : Number(e.target.value)
                        }))
                      }
                      style={{ width: 50 }}
                    />
                    <button
                      className="ml-1 px-2 py-0.5 bg-blue-500 text-white rounded text-xs"
                      style={{ fontSize: "0.75rem" }}
                      disabled={savingQuantity[task.id]}
                      onClick={() => handleSaveQuantity(doc.id, task.id)}
                      type="button"
                    >
                      儲存
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
