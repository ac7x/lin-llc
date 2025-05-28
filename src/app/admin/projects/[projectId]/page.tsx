"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, Timestamp, getDocs, collection } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

// 定義 Project 型別
type Project = {
  id: string;
  name?: string;
  createdBy?: string | null;
  createdAt?: Timestamp | Date | string | null;
  manager?: string;
  supervisors?: string[];
  safetyStaff?: string[];
  region?: string;
  address?: string;
  startDate?: string | null;
  endDate?: string | null;
  logs?: ProjectLog[];
};

type ProjectLog = {
  id: string;
  content: string;
  createdAt: Timestamp;
  createdBy: string;
  photoUrl?: string;
};

// 動態載入流程與日誌元件
const ProjectFlowPage = dynamic(() => import("./flow/page"), { ssr: false });
const ProjectJournalPage = dynamic(() => import("./journal/page"), { ssr: false });
const ProjectEditPage = dynamic(() => import("./edit/page"), { ssr: false });

export default function ProjectDetailPage() {
  const { projectId } = useParams() as { projectId: string };
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<{[key: string]: string}>({});
  const [tab, setTab] = useState<"detail" | "flow" | "journal" | "edit">("detail");

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
      }), {} as {[key: string]: string | undefined});
      setUsers(usersData);
    };
    fetchUsers();
  }, []);

  if (loading) return <main className="p-8">載入中...</main>;
  if (!project) return <main className="p-8">找不到專案</main>;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">專案：{project.name || "(未命名專案)"}</h1>
      <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-neutral-700">
        <button
          className={`px-4 py-2 font-semibold border-b-2 transition ${tab === "detail" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600 hover:text-blue-700"}`}
          onClick={() => setTab("detail")}
        >
          專案詳情
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
          className={`px-4 py-2 font-semibold border-b-2 transition ${tab === "edit" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600 hover:text-blue-700"}`}
          onClick={() => setTab("edit")}
        >
          編輯
        </button>
      </div>
      {tab === "detail" && (
        <div className="mb-4 text-gray-600">
          <div>建立者：{users[project.createdBy || ""] || "未知"}</div>
          <div>
            建立時間：
            {project.createdAt && typeof project.createdAt === "object" && "toDate" in project.createdAt
              ? (project.createdAt as Timestamp).toDate().toLocaleString()
              : String(project.createdAt) || "未知"}
          </div>
          <div>負責人：{users[project.manager || ""] || "-"}</div>
          <div>
            現場監工：
            {project.supervisors && project.supervisors.length > 0
              ? project.supervisors.map(id => users[id] || id).join(", ")
              : "-"}
          </div>
          <div>
            現場公共安全人員：
            {project.safetyStaff && project.safetyStaff.length > 0
              ? project.safetyStaff.map(id => users[id] || id).join(", ")
              : "-"}
          </div>
          <div>地區：{project.region || "-"}</div>
          <div>地址：{project.address || "-"}</div>
          <div>起始日：{project.startDate || "-"}</div>
          <div>預估結束日：{project.endDate || "-"}</div>
        </div>
      )}
      {tab === "flow" && <ProjectFlowPage />}
      {tab === "journal" && <ProjectJournalPage />}
      {tab === "edit" && <ProjectEditPage />}
    </main>
  );
}
