"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { addDoc, collection, getDocs, Timestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import Link from "next/link";

// 定義 Project 型別
type Project = {
  id: string;
  name?: string;
  createdBy?: string | null;
  createdAt?: Timestamp | Date | string | null;
};

export default function ProjectsPage() {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [projectName, setProjectName] = useState(""); // 新增狀態
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      const snapshot = await getDocs(collection(db, "projects"));
      setProjects(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Project[]
      );
    };
    fetchProjects();
  }, [success]); // 新增或成功時重新載入

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setError("請輸入專案名稱");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await addDoc(collection(db, "projects"), {
        name: projectName,
        createdAt: new Date(),
        createdBy: user?.uid || null,
      });
      setSuccess(true);
      setProjectName(""); // 清空輸入欄位
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("建立專案失敗");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <h1>專案管理</h1>
      <p>這裡是管理所有專案的頁面。</p>
      <input
        type="text"
        placeholder="請輸入專案名稱"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        disabled={loading}
        style={{ marginRight: 8 }}
      />
      <button onClick={handleCreateProject} disabled={loading || !user}>
        {loading ? "建立中..." : "建立專案"}
      </button>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {success && <div style={{ color: "green" }}>專案已建立！</div>}
      <hr style={{ margin: "24px 0" }} />
      <h2>專案列表</h2>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>
            <Link href={`/admin/projects/${project.id}`}>
              {project.name || "(未命名專案)"}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
