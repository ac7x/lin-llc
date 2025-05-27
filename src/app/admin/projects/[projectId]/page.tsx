"use client";

import { app } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { getFirestore, collection, query, orderBy, addDoc, doc, getDoc, getDocs } from "firebase/firestore";
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

  // 新增 state: 控制流程選擇 modal
  const [selectingAreaId, setSelectingAreaId] = useState<string | null>(null);
  const [flowsOptions, setFlowsOptions] = useState<{id: string, name: string}[]>([]);
  const [selectedFlowIds, setSelectedFlowIds] = useState<string[]>([]);
  const [loadingFlows, setLoadingFlows] = useState(false);

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

  // 開啟流程選擇 modal
  async function handleOpenFlowSelect(areaId: string) {
    setSelectingAreaId(areaId);
    setFlowsOptions([]);
    setSelectedFlowIds([]);
    setLoadingFlows(true);
    try {
      // 取得專案 templateId
      const projectDoc = await getDoc(doc(db, "projects", projectId));
      const templateId = projectDoc.exists() ? projectDoc.data().templateId : null;
      if (!templateId) {
        setAreaMsg("找不到範本，無法取得流程");
        setLoadingFlows(false);
        return;
      }
      const flowsRef = collection(db, "templates", templateId, "flows");
      const flowsSnap = await getDocs(flowsRef);
      setFlowsOptions(flowsSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
    } catch {
      setAreaMsg("取得流程失敗");
    }
    setLoadingFlows(false);
  }

  // 勾選流程
  function handleToggleFlow(flowId: string) {
    setSelectedFlowIds(ids => ids.includes(flowId) ? ids.filter(id => id !== flowId) : [...ids, flowId]);
  }

  // 執行複製
  async function handleCopySelectedFlows() {
    if (!selectingAreaId || selectedFlowIds.length === 0) return;
    setAreaMsg("");
    setLoadingFlows(true);
    try {
      // 取得專案 templateId
      const projectDoc = await getDoc(doc(db, "projects", projectId));
      const templateId = projectDoc.exists() ? projectDoc.data().templateId : null;
      if (!templateId) {
        setAreaMsg("找不到範本，無法複製流程");
        setLoadingFlows(false);
        return;
      }
      const flowsRef = collection(db, "templates", templateId, "flows");
      const flowsSnap = await getDocs(flowsRef);
      const tasksRef = collection(db, "projects", projectId, "areas", selectingAreaId, "tasks");
      for (const flowDoc of flowsSnap.docs) {
        if (selectedFlowIds.includes(flowDoc.id)) {
          const flow = flowDoc.data();
          await addDoc(tasksRef, {
            name: flow.name,
            order: typeof flow.order === "number" ? flow.order : 9999,
            status: "pending",
          });
        }
      }
      setAreaMsg("流程已複製到區域");
      setSelectingAreaId(null);
    } catch {
      setAreaMsg("複製流程失敗");
    }
    setLoadingFlows(false);
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
            <button
              className="bg-yellow-500 text-white px-2 py-1 rounded text-xs"
              type="button"
              onClick={() => handleOpenFlowSelect(doc.id)}
            >
              複製流程
            </button>
            {/* 流程選擇 modal/inline */}
            {selectingAreaId === doc.id && (
              <div className="absolute left-0 top-full mt-2 bg-white border rounded shadow-lg p-4 z-50 w-64">
                <div className="font-bold mb-2">選擇要複製的流程</div>
                {loadingFlows ? (
                  <div>載入中...</div>
                ) : flowsOptions.length === 0 ? (
                  <div className="text-gray-500">無可用流程</div>
                ) : (
                  <form onSubmit={e => { e.preventDefault(); handleCopySelectedFlows(); }}>
                    <div className="max-h-40 overflow-y-auto mb-2">
                      {flowsOptions.map(f => (
                        <label key={f.id} className="flex items-center gap-2 mb-1">
                          <input
                            type="checkbox"
                            checked={selectedFlowIds.includes(f.id)}
                            onChange={() => handleToggleFlow(f.id)}
                          />
                          {f.name}
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="bg-blue-600 text-white px-2 py-1 rounded text-xs" disabled={selectedFlowIds.length === 0 || loadingFlows}>確定</button>
                      <button type="button" className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs" onClick={() => setSelectingAreaId(null)}>取消</button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
