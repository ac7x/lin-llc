"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, Timestamp, getDocs, collection } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

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
  logs?: ProjectLog[];
  ownerName?: string;
  budget?: number;
  totalSpent?: number;
  remainingBudget?: number;
  expenses?: Expense[];
};

type ProjectLog = {
  id: string;
  content: string;
  createdAt: Timestamp;
  createdBy: string;
  photoUrl?: string;
};

type Expense = {
  id: string;
  name: string;
  amount: number;
  date: string;
  note?: string;
};

// 動態載入流程與日誌元件
const ProjectFlowPage = dynamic(() => import("./flow/page"), { ssr: false });
const ProjectJournalPage = dynamic(() => import("./journal/page"), { ssr: false });
const ProjectEditPage = dynamic(() => import("./edit/page"), { ssr: false });
const ProjectAttendancePage = dynamic(() => import("./attendance/page"), { ssr: false });
const ProjectZonesPage = dynamic(() => import("./zones/page"), { ssr: false }); // 保留動態載入
const ProjectSchedulePage = dynamic(() => import("./schedule/page"), { ssr: false }); // 新增進度排程頁面動態載入

export default function ProjectDetailPage() {
  const { projectId } = useParams() as { projectId: string };
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<{ [key: string]: string }>({});
  const [tab, setTab] = useState<"detail" | "flow" | "journal" | "edit" | "attendance" | "schedule">("detail"); // 移除 zones

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      const ref = doc(db, "projects", projectId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const projectData = snap.data();
        setProject({ id: snap.id, ...projectData } as Project);
      }
      setLoading(false);
    };
    fetchProject();
  }, [projectId]);

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const usersData = snapshot.docs.reduce((acc, doc) => ({
        ...acc,
        [doc.id]: doc.data().displayName || doc.data().name || undefined
      }), {} as { [key: string]: string | undefined });
      setUsers(usersData);
    };
    fetchUsers();
  }, []);

  if (loading) return <main className="p-8">載入中...</main>;
  if (!project) return <main className="p-8">找不到專案</main>;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">專案：{project.projectName || "(未命名專案)"}</h1>
      <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-neutral-700">
        <button
          className={`px-4 py-2 font-semibold border-b-2 transition ${tab === "detail" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600 hover:text-blue-700"}`}
          onClick={() => setTab("detail")}
        >
          專案詳情
        </button>
        <button
          className={`px-4 py-2 font-semibold border-b-2 transition ${tab === "schedule" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600 hover:text-blue-700"}`}
          onClick={() => setTab("schedule")}
        >
          進度排程
        </button>
        <button
          className={`px-4 py-2 font-semibold border-b-2 transition ${tab === "flow" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600 hover:text-blue-700"}`}
          onClick={() => setTab("flow")}
        >
          工程流程
        </button>
        <button
          className={`px-4 py-2 font-semibold border-b-2 transition ${tab === "journal" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600 hover:text-blue-700"}`}
          onClick={() => setTab("journal")}
        >
          工程日誌
        </button>
        <button
          className={`px-4 py-2 font-semibold border-b-2 transition ${tab === "attendance" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600 hover:text-blue-700"}`}
          onClick={() => setTab("attendance")}
        >
          出工人數
        </button>
        <button
          className={`px-4 py-2 font-semibold border-b-2 transition ${tab === "edit" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600 hover:text-blue-700"}`}
          onClick={() => setTab("edit")}
        >
          編輯
        </button>
      </div>
      {tab === "detail" && (
        <div className="mb-4 text-gray-600">
          <div>協調者：{users[project.coord || ""] || "-"}</div>
          <div>
            監工：
            {project.foreman && project.foreman.length > 0
              ? project.foreman.map(id => users[id] || id).join(", ")
              : "-"}
          </div>
          <div>
            安全人員：
            {project.safety && project.safety.length > 0
              ? project.safety.map(id => users[id] || id).join(", ")
              : "-"}
          </div>
          <div>地區：{project.region || "-"}</div>
          <div>地址：{project.address || "-"}</div>
          <div>起始日：{project.startDate || "-"}</div>
          <div>預估結束日：{project.endDate || "-"}</div>
          <div>業主：{project.ownerName || "-"}</div>
          <div>預算：{typeof project.budget === "number" ? project.budget.toLocaleString() : "-"}</div>
          <div>已支出：{typeof project.totalSpent === "number" ? project.totalSpent.toLocaleString() : "-"}</div>
          <div>剩餘預算：{typeof project.remainingBudget === "number" ? project.remainingBudget.toLocaleString() : "-"}</div>
          <div>支出明細：{project.expenses && project.expenses.length > 0 ? (
            <ul className="list-disc ml-5">
              {project.expenses.map(e => (
                <li key={e.id}>
                  {e.name} - {e.amount.toLocaleString()} 元 ({e.date}){e.note ? `，備註：${e.note}` : ""}
                </li>
              ))}
            </ul>
          ) : "-"}</div>
          {/* 區域列表嵌入在支出明細下方 */}
          <div className="mt-8">
            <h2 className="text-lg font-bold mb-2">區域列表</h2>
            <ProjectZonesPage />
          </div>
        </div>
      )}
      {tab === "schedule" && <ProjectSchedulePage />}
      {tab === "flow" && <ProjectFlowPage />}
      {tab === "journal" && <ProjectJournalPage />}
      {tab === "attendance" && <ProjectAttendancePage />}
      {tab === "edit" && <ProjectEditPage />}
    </main>
  );
}
