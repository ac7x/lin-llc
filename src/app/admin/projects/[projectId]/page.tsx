"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

// 定義 Project 型別
type Project = {
  id: string;
  name?: string;
  createdBy?: string | null;
  createdAt?: Timestamp | Date | string | null;
};

export default function ProjectDetailPage() {
  const { projectId } = useParams() as { projectId: string };
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      const ref = doc(db, "projects", projectId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setProject({ id: snap.id, ...snap.data() } as Project);
      }
      setLoading(false);
    };
    fetchProject();
  }, [projectId]);

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
    </main>
  );
}
