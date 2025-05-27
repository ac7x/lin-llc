"use client";

import { app } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { getFirestore, collection, query, orderBy, addDoc, doc, getDoc } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { useParams } from "next/navigation";
import { useState } from "react";

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

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">專案詳細頁</h1>
      <div>專案 ID: {projectId}</div>
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
          <li key={doc.id} className="border p-2 rounded flex items-center gap-2">
            <span className="flex-1">{doc.data().name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
