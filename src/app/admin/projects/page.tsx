"use client";

import React, { useState, useEffect } from "react";
import { db, auth } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs, addDoc, Timestamp, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { delay } from "@/utils/delay";

// 定義 Expense 型別
type Expense = {
  id: string;
  name: string;
  amount: number;
  date: string;
  note?: string;
};

// 定義 Project 型別
type Project = {
  id: string;
  projectName?: string; // 將 name 改為 projectName
  createdBy?: string | null;
  createdAt?: Timestamp | Date | string | null;
  coord?: string; // 協調者
  foreman?: string[]; // 監工
  safety?: string[]; // 安全人員
  region?: string;
  address?: string;
  startDate?: string | null;
  endDate?: string | null;
  status?: "planning" | "inProgress" | "completed" | "onHold";
  ownerName?: string;
  budget?: number;
  totalSpent?: number;
  remainingBudget?: number;
  expenses?: Expense[];
};

export default function ProjectsPage() {
  // 新增專案表單狀態
  const [user] = useAuthState(auth);
  const [projectName, setProjectName] = useState("");
  const [coord, setCoord] = useState("");
  const [foreman, setForeman] = useState<string[]>([]);
  const [safety, setSafety] = useState<string[]>([]);
  const [region, setRegion] = useState("");
  const [address, setAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<"planning" | "inProgress" | "completed" | "onHold">("planning");
  const [ownerName, setOwnerName] = useState("");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);

  // 專案列表狀態
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [users, setUsers] = useState<{ [key: string]: string }>({});
  const [peopleOptions, setPeopleOptions] = useState<{ id: string; name: string }[]>([]);
  const router = useRouter();

  // 取得 users
  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const usersData = snapshot.docs.reduce((acc, doc) => ({
        ...acc,
        [doc.id]: doc.data().displayName || doc.data().name || undefined
      }), {} as { [key: string]: string | undefined });
      setUsers(usersData);
      setPeopleOptions(
        snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          return { id: doc.id, name: data.displayName || data.name || doc.id };
        })
      );
    };
    fetchUsers();
  }, []);

  // 取得 projects
  const fetchProjects = async () => {
    setLoadingList(true);
    const snapshot = await getDocs(collection(db, "projects"));
    setProjects(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[]
    );
    setLoadingList(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // 新增專案
  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setError("請輸入專案名稱");
      return;
    }
    setLoadingAdd(true);
    setError(null);
    setSuccess(false);
    try {
      await addDoc(collection(db, "projects"), {
        projectName,
        createdAt: new Date(),
        createdBy: user?.uid || null,
        coord,
        foreman,
        safety,
        region,
        address,
        startDate: startDate || null,
        endDate: endDate || null,
        status,
        ownerName: ownerName || null,
        budget: budget ? Number(budget) : null,
      });
      setSuccess(true);
      setProjectName("");
      setCoord("");
      setForeman([]);
      setSafety([]);
      setRegion("");
      setAddress("");
      setStartDate("");
      setEndDate("");
      setStatus("planning");
      setOwnerName("");
      setBudget("");
      await delay(300); // 新增延遲，讓 UI 有時間渲染
      await fetchProjects();
      setTimeout(() => setSuccess(false), 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("建立專案失敗");
      }
    } finally {
      setLoadingAdd(false);
    }
  };

  // 多選處理
  const handleMultiSelect = (
    value: string,
    selected: string[],
    setSelected: (v: string[]) => void
  ) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((v) => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  const regionOptions = ["北部", "中部", "南部", "東部", "離島"];
  const statusOptions = [
    { value: "planning", label: "規劃中" },
    { value: "inProgress", label: "進行中" },
    { value: "completed", label: "已完成" },
    { value: "onHold", label: "暫停中" },
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-bold text-2xl mb-2">專案管理</h1>
      <p className="text-gray-500 mb-6">這裡是管理所有專案的頁面。</p>
      {/* 新增專案表單 */}
      <section className="mb-10 bg-gray-50 dark:bg-neutral-900 rounded-xl p-6 shadow">
        <h2 className="text-xl font-semibold mb-4">新增專案</h2>
        <div className="mb-4">
          <input
            type="text"
            placeholder="請輸入專案名稱"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            disabled={loadingAdd}
            className="px-3 py-2 border border-gray-300 rounded w-72 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">
            地區：
            <select
              value={region}
              onChange={e => setRegion(e.target.value)}
              disabled={loadingAdd}
              className="ml-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">請選擇</option>
              {regionOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">
            地址：
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              disabled={loadingAdd}
              className="ml-2 px-3 py-2 border border-gray-300 rounded w-80 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="請輸入地址"
            />
          </label>
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">
            起始日：
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              disabled={loadingAdd}
              className="ml-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </label>
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">
            預估結束日：
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              disabled={loadingAdd}
              className="ml-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </label>
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">
            狀態：
            <select
              value={status}
              onChange={e => setStatus(e.target.value as "planning" | "inProgress" | "completed" | "onHold")}
              disabled={loadingAdd}
              className="ml-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">
            協調者（單選）：
            <select
              value={coord}
              onChange={e => setCoord(e.target.value)}
              disabled={loadingAdd}
              className="ml-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">請選擇</option>
              {peopleOptions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">監工（可複選）：</label>
          <div className="flex flex-wrap gap-4">
            {peopleOptions.map(p => (
              <label key={p.id} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={foreman.includes(p.id)}
                  onChange={() => handleMultiSelect(p.id, foreman, setForeman)}
                  disabled={loadingAdd}
                  className="accent-blue-600"
                />
                {p.name}
              </label>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">安全人員（可複選）：</label>
          <div className="flex flex-wrap gap-4">
            {peopleOptions.map(p => (
              <label key={p.id} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={safety.includes(p.id)}
                  onChange={() => handleMultiSelect(p.id, safety, setSafety)}
                  disabled={loadingAdd}
                  className="accent-blue-600"
                />
                {p.name}
              </label>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">
            業主：
            <input
              type="text"
              value={ownerName}
              onChange={e => setOwnerName(e.target.value)}
              disabled={loadingAdd}
              className="ml-2 px-3 py-2 border border-gray-300 rounded w-72 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="請輸入業主名稱"
            />
          </label>
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">
            預算：
            <input
              type="number"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              disabled={loadingAdd}
              className="ml-2 px-3 py-2 border border-gray-300 rounded w-40 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="請輸入預算金額"
              min="0"
            />
          </label>
        </div>
        <button
          onClick={handleCreateProject}
          disabled={loadingAdd || !user}
          className="bg-blue-700 hover:bg-blue-800 text-white rounded px-6 py-2 font-semibold text-base transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loadingAdd ? "建立中..." : "建立專案"}
        </button>
        {error && <div className="text-red-600 mt-2">{error}</div>}
        {success && <div className="text-green-600 mt-2">專案已建立！</div>}
      </section>
      {/* 專案列表 */}
      <hr className="my-8 border-t border-gray-200" />
      <h2 className="font-semibold text-lg mb-4">專案列表</h2>
      {loadingList ? (
        <div>載入中...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              className="bg-white dark:bg-neutral-900 rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col gap-2 cursor-pointer"
              key={project.id}
              onClick={() => router.push(`/admin/projects/${project.id}`)}
              tabIndex={0}
              role="button"
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  router.push(`/admin/projects/${project.id}`);
                }
              }}
            >
              <Link
                href={`/admin/projects/${project.id}`}
                className="no-underline"
                onClick={e => e.stopPropagation()}
              >
                <span className="text-blue-700 font-bold text-lg hover:underline">{project.projectName || "(未命名專案)"}</span>
              </Link>
              <div className="text-gray-700 text-sm flex flex-col gap-1 mt-2">
                <div>
                  <span className="text-gray-500 font-medium">地區：</span>
                  {project.region || "-"}
                </div>
                <div>
                  <span className="text-gray-500 font-medium">地址：</span>
                  {project.address || "-"}
                </div>
                <div>
                  <span className="text-gray-500 font-medium">協調者：</span>
                  {project.coord && users[project.coord] ? users[project.coord] : "-"}
                </div>
                <div>
                  <span className="text-gray-500 font-medium">監工：</span>
                  {project.foreman && project.foreman.length > 0
                    ? project.foreman.map(id => users[id]).filter(Boolean).join(", ") || "-"
                    : "-"}
                </div>
                <div>
                  <span className="text-gray-500 font-medium">安全人員：</span>
                  {project.safety && project.safety.length > 0
                    ? project.safety.map(id => users[id]).filter(Boolean).join(", ") || "-"
                    : "-"}
                </div>
                <div>
                  <span className="text-gray-500 font-medium">起始日：</span>
                  {project.startDate || "-"}
                </div>
                <div>
                  <span className="text-gray-500 font-medium">預估結束日：</span>
                  {project.endDate || "-"}
                </div>
                <div>
                  <span className="text-gray-500 font-medium">狀態：</span>
                  {(() => {
                    switch (project.status) {
                      case "planning": return "規劃中";
                      case "inProgress": return "進行中";
                      case "completed": return "已完成";
                      case "onHold": return "暫停中";
                      default: return "-";
                    }
                  })()}
                </div>
                <div>
                  <span className="text-gray-500 font-medium">業主：</span>
                  {project.ownerName || "-"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
