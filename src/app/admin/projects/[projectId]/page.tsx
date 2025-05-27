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

  if (loading) return <main>載入中...</main>;
  if (!project) return <main>找不到專案</main>;

  return (
    <main>
      <h1>專案：{project.name || "(未命名專案)"}</h1>
      <p>專案 ID：{project.id}</p>
      <p>建立者：{project.createdBy || "未知"}</p>
      <p>建立時間：{project.createdAt && typeof project.createdAt === "object" && "toDate" in project.createdAt
        ? (project.createdAt as Timestamp).toDate().toLocaleString()
        : String(project.createdAt) || "未知"}
      </p>
      <p>負責人：{project.manager || "-"}</p>
      <p>現場監工：{project.supervisors && project.supervisors.length > 0 ? project.supervisors.join(", ") : "-"}</p>
      <p>現場公共安全人員：{project.safetyStaff && project.safetyStaff.length > 0 ? project.safetyStaff.join(", ") : "-"}</p>
      <p>地區：{project.region || "-"}</p>
      <p>地址：{project.address || "-"}</p>
      <p>起始日：{project.startDate || "-"}</p>
      <p>預估結束日：{project.endDate || "-"}</p>
      {/* 若要顯示名稱，需額外查詢 users 集合並建立 id→name 對照表 */}
      <div style={{ marginTop: 24 }}>
        <button
          onClick={() => router.push(`/admin/projects/${projectId}/edit`)}
          style={{
            background: "#2355d6",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 20px",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: "pointer"
          }}
        >
          編輯
        </button>
      </div>

      <div className="logs-section">
        <h2>工程進度日誌</h2>
        <div className="add-log">
          <textarea
            value={newLog}
            onChange={(e) => setNewLog(e.target.value)}
            placeholder="輸入新的進度記錄..."
            rows={3}
          />
          <button onClick={handleAddLog} disabled={!newLog.trim() || !user}>
            添加記錄
          </button>
        </div>

        <div className="logs-list">
          {project?.logs?.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
            .map((log) => (
            <div key={log.id} className="log-item">
              <div className="log-content">{log.content}</div>
              <div className="log-meta">
                {log.createdAt.toDate().toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .logs-section {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #eee;
        }
        .add-log {
          margin: 16px 0;
        }
        .add-log textarea {
          width: 100%;
          padding: 8px;
          margin-bottom: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .logs-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .log-item {
          padding: 12px;
          background: #f8f8f8;
          border-radius: 6px;
        }
        .log-content {
          white-space: pre-wrap;
        }
        .log-meta {
          margin-top: 8px;
          font-size: 0.9em;
          color: #666;
        }
      `}</style>
    </main>
  );
}
