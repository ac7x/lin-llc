"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, Timestamp, addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

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
};

export default function ProjectDetailPage() {
  const { projectId } = useParams() as { projectId: string };
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [newLog, setNewLog] = useState("");
  const [users, setUsers] = useState<{[key: string]: string}>({});
  const router = useRouter();
  const [user] = useAuthState(auth);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      const ref = doc(db, "projects", projectId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const projectData = snap.data();
        // 同時獲取日誌並確保型別正確
        const logsSnap = await getDocs(collection(db, "projects", projectId, "logs"));
        const logs = logsSnap.docs.map(doc => ({
          id: doc.id,
          content: doc.data().content,
          createdAt: doc.data().createdAt,
          createdBy: doc.data().createdBy
        })) as ProjectLog[];
        
        setProject({ 
          id: snap.id, 
          ...projectData,
          logs 
        } as Project);
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

  const handleAddLog = async () => {
    if (!newLog.trim() || !user) return;

    try {
      await addDoc(collection(db, "projects", projectId, "logs"), {
        content: newLog.trim(),
        createdAt: new Date(),
        createdBy: user.uid
      });

      setNewLog("");
      // 重新獲取日誌並確保型別正確
      const logsSnap = await getDocs(collection(db, "projects", projectId, "logs"));
      const logs = logsSnap.docs.map(doc => ({
        id: doc.id,
        content: doc.data().content,
        createdAt: doc.data().createdAt,
        createdBy: doc.data().createdBy
      })) as ProjectLog[];
      
      setProject(prev => prev ? { ...prev, logs } : null);
    } catch (error) {
      console.error("Error adding log:", error);
    }
  };

  if (loading) return <main className="p-8">載入中...</main>;
  if (!project) return <main className="p-8">找不到專案</main>;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">專案：{project.name || "(未命名專案)"}</h1>
      <div className="mb-4 text-gray-600">
        <div>專案 ID：{project.id}</div>
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
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => router.push(`/admin/projects/${projectId}/edit`)}
          className="bg-blue-700 hover:bg-blue-800 text-white rounded px-6 py-2 font-semibold text-base transition"
        >
          編輯
        </button>
        <button
          onClick={() => router.push(`/admin/projects/${projectId}/flow`)}
          className="bg-blue-400 hover:bg-blue-500 text-white rounded px-6 py-2 font-semibold text-base transition"
        >
          前往工程流程
        </button>
      </div>

      <div className="logs-section mt-10 pt-8 border-t border-gray-200">
        <h2 className="text-xl font-semibold mb-4">工程進度日誌</h2>
        <div className="add-log mb-6">
          <textarea
            value={newLog}
            onChange={(e) => setNewLog(e.target.value)}
            placeholder="輸入新的進度記錄..."
            rows={3}
            className="w-full p-2 mb-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            onClick={handleAddLog}
            disabled={!newLog.trim() || !user}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded px-5 py-2 font-semibold text-base transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            添加記錄
          </button>
        </div>

        <div className="logs-list flex flex-col gap-3">
          {project?.logs?.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
            .map((log) => (
            <div key={log.id} className="log-item p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg shadow">
              <div className="log-content whitespace-pre-wrap">{log.content}</div>
              <div className="log-meta mt-2 text-sm text-gray-500">
                {log.createdAt.toDate().toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
