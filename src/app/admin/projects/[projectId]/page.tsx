"use client";

import { app } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { getFirestore, collection, query, orderBy, addDoc, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { useParams } from "next/navigation";
import { useState } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import { getUsersList } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const db = getFirestore(app);
  // const tasksRef = collection(db, "projects", projectId, "tasks");
  // const [tasksSnap] = useCollection(query(tasksRef, orderBy("order", "asc")));

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
    quantity?: number;
    plannedStartTime?: string; // 新增
    plannedEndTime?: string;   // 新增
  };

  const [areaTasks, setAreaTasks] = useState<{ [areaId: string]: AreaTask[] }>({});

  // 新增：載入每個區域的 tasks
  React.useEffect(() => {
    async function fetchAreaTasks() {
      if (!areasSnap) return;
      const result: { [areaId: string]: AreaTask[] } = {};
      for (const areaDoc of areasSnap.docs) {
        // 依 order 欄位排序
        const tasksRef = collection(db, "projects", projectId, "areas", areaDoc.id, "tasks");
        const q = query(tasksRef, orderBy("order", "asc"));
        const tasksSnap = await getDocs(q);
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
  const [managerName, setManagerName] = useState("");
  const [supervisorNames, setSupervisorNames] = useState<string>("");
  const [safetyNames, setSafetyNames] = useState<string>("");
  const [projectRegion, setProjectRegion] = useState(""); // 新增地區
  const [projectAddress, setProjectAddress] = useState(""); // 新增地址
  const [users, setUsers] = useState<{ uid: string; displayName?: string; email?: string }[]>([]);

  React.useEffect(() => {
    getUsersList().then(setUsers);
  }, []);

  React.useEffect(() => {
    async function fetchProject() {
      const projectDoc = await getDoc(doc(db, "projects", projectId));
      if (projectDoc.exists()) {
        setProjectName(projectDoc.data().name || "");
        setProjectDesc(projectDoc.data().description || "");
        setProjectRegion(projectDoc.data().region || ""); // 取得地區
        setProjectAddress(projectDoc.data().address || ""); // 取得地址
        const m = projectDoc.data().manager;
        const s = projectDoc.data().supervisor;
        const sa = projectDoc.data().safety;
        setManagerName(users.find(u => u.uid === m)?.displayName || users.find(u => u.uid === m)?.email || m || "");
        // supervisor/safety 可能為陣列
        const supervisorArr = Array.isArray(s) ? s : s ? [s] : [];
        const safetyArr = Array.isArray(sa) ? sa : sa ? [sa] : [];
        setSupervisorNames(
          supervisorArr.length
            ? supervisorArr.map(uid => {
                const u = users.find(user => user.uid === uid);
                return u?.displayName || u?.email || uid;
              }).join(', ')
            : "—"
        );
        setSafetyNames(
          safetyArr.length
            ? safetyArr.map(uid => {
                const u = users.find(user => user.uid === uid);
                return u?.displayName || u?.email || uid;
              }).join(', ')
            : "—"
        );
      }
    }
    if (projectId && users.length) fetchProject();
  }, [db, projectId, users]);

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

  // 新增：追蹤每個任務的日期編輯狀態
  const [editDates, setEditDates] = useState<{ [taskId: string]: { plannedStartTime: string; plannedEndTime: string } }>({});
  const [savingDate, setSavingDate] = useState<{ [taskId: string]: boolean }>({});

  // 儲存預計日期
  async function handleSaveDates(areaId: string, taskId: string) {
    const { plannedStartTime, plannedEndTime } = editDates[taskId] || {};
    setSavingDate(s => ({ ...s, [taskId]: true }));
    try {
      await updateDoc(
        doc(db, "projects", projectId, "areas", areaId, "tasks", taskId),
        {
          plannedStartTime: plannedStartTime || null,
          plannedEndTime: plannedEndTime || null,
        }
      );
    } catch {
      // 可加錯誤提示
    }
    setSavingDate(s => ({ ...s, [taskId]: false }));
  }

  // 新增：目前選擇的區域 tab
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);

  React.useEffect(() => {
    // 若初次載入自動選第一個區域
    if (areasSnap && areasSnap.docs.length > 0 && !activeAreaId) {
      setActiveAreaId(areasSnap.docs[0].id);
    }
  }, [areasSnap, activeAreaId]);

  return (
    <div className="p-8 max-w-2xl mx-auto dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 dark:text-gray-100">專案詳細頁</h1>
      <div className="dark:text-gray-300">專案 ID: {projectId}</div>
      {/* 專案資訊區塊 */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg dark:text-blue-200">{projectName}</span>
          <button
            className="text-blue-600 underline dark:text-blue-400"
            onClick={() => router.push(`/admin/projects/${projectId}/edit`)}
            type="button"
          >
            編輯
          </button>
        </div>
        <div className="text-gray-600 dark:text-gray-300">{projectDesc}</div>
        <div className="text-sm text-gray-700 mt-2 dark:text-gray-200">
          <div>負責人：{managerName || '—'}</div>
          <div>現場監工：{supervisorNames}</div>
          <div>安全衛生人員：{safetyNames}</div>
          <div>地區：{projectRegion || '—'}</div>
          <div>地址：{projectAddress || '—'}</div>
        </div>
      </div>
      {/* 刪除原本的任務清單區塊 */}
      {/* 
      <h2 className="text-lg font-semibold mt-6 mb-2 dark:text-gray-100">任務清單</h2>
      <ul className="space-y-2">
        {tasksSnap?.docs.length === 0 && <li className="text-gray-500 dark:text-gray-400">尚無任務</li>}
        {tasksSnap?.docs.map(doc => (
          <li key={doc.id} className="border p-2 rounded flex items-center gap-2 dark:border-gray-700 dark:bg-gray-800">
            <span className="flex-1 dark:text-gray-100">{doc.data().name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{doc.data().status === "done" ? "✅ 已完成" : "⏳ 未完成"}</span>
          </li>
        ))}
      </ul>
      */}
      {/* 區域管理 */}
      <h2 className="text-lg font-semibold mt-8 mb-2 dark:text-gray-100">區域管理</h2>
      <button
        className="bg-blue-600 text-white px-3 py-1 rounded mb-3 dark:bg-blue-500"
        onClick={() => setAddingArea(v => !v)}
        type="button"
      >
        {addingArea ? "取消" : "新增區域"}
      </button>
      {addingArea && (
        <form onSubmit={handleAddArea} className="flex gap-2 mb-4">
          <input
            className="border px-2 py-1 flex-1 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            value={areaName}
            onChange={e => setAreaName(e.target.value)}
            placeholder="區域名稱"
            required
          />
          <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded dark:bg-green-700">儲存</button>
        </form>
      )}
      {areaMsg && <div className="text-green-700 mb-2 dark:text-green-400">{areaMsg}</div>}

      {/* Tabs for areas */}
      <div className="mb-4 flex flex-wrap gap-2">
        {areasSnap?.docs.length === 0 && (
          <span className="text-gray-500 dark:text-gray-400">尚無區域</span>
        )}
        {areasSnap?.docs.map(doc => (
          <button
            key={doc.id}
            className={`px-4 py-1 rounded-t border-b-2 ${
              activeAreaId === doc.id
                ? "border-blue-600 bg-blue-100 dark:bg-blue-900 dark:border-blue-400"
                : "border-transparent bg-gray-100 dark:bg-gray-800"
            } dark:text-gray-100`}
            onClick={() => setActiveAreaId(doc.id)}
            type="button"
          >
            {doc.data().name}
          </button>
        ))}
      </div>

      {/* 區域內容 */}
      {activeAreaId && (
        <div className="border rounded-b p-4 dark:border-gray-700 dark:bg-gray-800">
          <span className="font-bold dark:text-gray-100">
            {areasSnap?.docs.find(d => d.id === activeAreaId)?.data().name}
          </span>
          {/* 顯示該區域的 tasks */}
          <ul className="ml-2 mt-2 space-y-1">
            {areaTasks[activeAreaId]?.length === 0 && (
              <li className="text-xs text-gray-400 dark:text-gray-500">（無任務）</li>
            )}
            {areaTasks[activeAreaId]?.map(task => (
              <li key={task.id} className="text-xs flex flex-col gap-1">
                <div className="flex gap-2 items-center">
                  <span className="dark:text-gray-100">{task.name}</span>
                  <span className="text-gray-400 dark:text-gray-500">{task.status === "done" ? "✅ 已完成" : "⏳ 未完成"}</span>
                  {/* 數量編輯 */}
                  <span>
                    數量：
                    <input
                      type="number"
                      min={0}
                      className="border px-1 w-16 text-xs dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
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
                      className="ml-1 px-2 py-0.5 bg-blue-500 text-white rounded text-xs dark:bg-blue-700"
                      style={{ fontSize: "0.75rem" }}
                      disabled={savingQuantity[task.id]}
                      onClick={() => handleSaveQuantity(activeAreaId, task.id)}
                      type="button"
                    >
                      儲存
                    </button>
                  </span>
                </div>
                {/* 預計日期編輯 */}
                <div className="flex gap-2 items-center mt-1">
                  <span className="dark:text-gray-100">預計開始：</span>
                  <input
                    type="date"
                    className="border px-1 text-xs dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                    value={
                      editDates[task.id]?.plannedStartTime ??
                      (task.plannedStartTime ? task.plannedStartTime.slice(0, 10) : "")
                    }
                    onChange={e =>
                      setEditDates(d => ({
                        ...d,
                        [task.id]: {
                          plannedStartTime: e.target.value,
                          plannedEndTime: d[task.id]?.plannedEndTime ?? (task.plannedEndTime ? task.plannedEndTime.slice(0, 10) : "")
                        }
                      }))
                    }
                    style={{ width: 130 }}
                  />
                  <span className="dark:text-gray-100">結束：</span>
                  <input
                    type="date"
                    className="border px-1 text-xs dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                    value={
                      editDates[task.id]?.plannedEndTime ??
                      (task.plannedEndTime ? task.plannedEndTime.slice(0, 10) : "")
                    }
                    onChange={e =>
                      setEditDates(d => ({
                        ...d,
                        [task.id]: {
                          plannedStartTime: d[task.id]?.plannedStartTime ?? (task.plannedStartTime ? task.plannedStartTime.slice(0, 10) : ""),
                          plannedEndTime: e.target.value
                        }
                      }))
                    }
                    style={{ width: 130 }}
                  />
                  <button
                    className="ml-1 px-2 py-0.5 bg-blue-500 text-white rounded text-xs dark:bg-blue-700"
                    style={{ fontSize: "0.75rem" }}
                    disabled={savingDate[task.id]}
                    onClick={() => handleSaveDates(activeAreaId, task.id)}
                    type="button"
                  >
                    儲存
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
