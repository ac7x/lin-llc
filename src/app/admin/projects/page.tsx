"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import Link from "next/link";

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
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "projects"));
      setProjects(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Project[]
      );
      setLoading(false);
    };
    fetchProjects();
  }, []);

  return (
    <main>
      <h1>專案管理</h1>
      <p>這裡是管理所有專案的頁面。</p>
      <Link href="/admin/projects/add">
        <button>新增專案</button>
      </Link>
      <hr style={{ margin: "24px 0" }} />
      <h2>專案列表</h2>
      {loading ? (
        <div>載入中...</div>
      ) : (
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              <Link href={`/admin/projects/${project.id}`}>
                {project.name || "(未命名專案)"}
              </Link>
              {/* 顯示新欄位（僅顯示 ID） */}
              <div style={{ fontSize: "0.9em", color: "#666" }}>
                負責人: {project.manager || "-"}<br />
                監工: {(project.supervisors && project.supervisors.length > 0) ? project.supervisors.join(", ") : "-"}<br />
                公共安全人員: {(project.safetyStaff && project.safetyStaff.length > 0) ? project.safetyStaff.join(", ") : "-"}<br />
                地區: {project.region || "-"}<br />
                地址: {project.address || "-"}<br />
                起始日: {project.startDate || "-"}<br />
                預估結束日: {project.endDate || "-"}
              </div>
            </li>
          ))}
        </ul>
      )}
      {/* 若要顯示名稱，需額外查詢 users 集合並建立 id→name 對照表 */}
    </main>
  );
}
