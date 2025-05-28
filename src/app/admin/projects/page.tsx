"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const [users, setUsers] = useState<{[key: string]: string}>({});
  const router = useRouter();

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

  return (
    <main>
      <h1 style={{ fontWeight: 700, fontSize: "2rem", marginBottom: 8 }}>專案管理</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>這裡是管理所有專案的頁面。</p>
      <Link href="/admin/projects/add">
        <button className="modern-btn">新增專案</button>
      </Link>
      <hr style={{ margin: "32px 0 24px 0", border: "none", borderTop: "1px solid #eee" }} />
      <h2 style={{ fontWeight: 600, fontSize: "1.3rem", marginBottom: 16 }}>專案列表</h2>
      {loading ? (
        <div>載入中...</div>
      ) : (
        <div className="project-list">
          {projects.map((project) => (
            <div
              className="project-card clickable"
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
              <Link href={`/admin/projects/${project.id}`} className="project-title-link" onClick={e => e.stopPropagation()}>
                <span className="project-title">{project.name || "(未命名專案)"}</span>
              </Link>
              <div className="project-meta">
                <div><span className="meta-label">負責人：</span>{project.manager && users[project.manager] ? users[project.manager] : "-"}</div>
                <div>
                  <span className="meta-label">監工：</span>
                  {project.supervisors && project.supervisors.length > 0
                    ? project.supervisors.map(id => users[id]).filter(Boolean).join(", ") || "-"
                    : "-"}
                </div>
                <div>
                  <span className="meta-label">公共安全人員：</span>
                  {project.safetyStaff && project.safetyStaff.length > 0
                    ? project.safetyStaff.map(id => users[id]).filter(Boolean).join(", ") || "-"
                    : "-"}
                </div>
                <div><span className="meta-label">地區：</span>{project.region || "-"}</div>
                <div><span className="meta-label">地址：</span>{project.address || "-"}</div>
                <div><span className="meta-label">起始日：</span>{project.startDate || "-"}</div>
                <div><span className="meta-label">預估結束日：</span>{project.endDate || "-"}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* 若要顯示名稱，需額外查詢 users 集合並建立 id→name 對照表 */}
      <style jsx>{`
        .modern-btn {
          background: linear-gradient(90deg, #4f8cff 0%, #2355d6 100%);
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 10px 24px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(79,140,255,0.08);
          transition: background 0.2s, box-shadow 0.2s;
        }
        .modern-btn:hover {
          background: linear-gradient(90deg, #2355d6 0%, #4f8cff 100%);
          box-shadow: 0 4px 16px rgba(79,140,255,0.15);
        }
        .project-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
        }
        .project-card {
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.07);
          padding: 24px 20px 18px 20px;
          transition: box-shadow 0.18s, transform 0.18s;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .project-card:hover {
          box-shadow: 0 6px 32px rgba(79,140,255,0.13);
          transform: translateY(-2px) scale(1.015);
        }
        .project-card.clickable {
          cursor: pointer;
        }
        .project-title-link {
          text-decoration: none;
        }
        .project-title {
          font-size: 1.18rem;
          font-weight: 700;
          color: #2355d6;
          margin-bottom: 8px;
          display: inline-block;
        }
        .project-title-link:hover .project-title {
          text-decoration: underline;
          color: #4f8cff;
        }
        .project-meta {
          font-size: 0.98em;
          color: #444;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .meta-label {
          color: #888;
          font-weight: 500;
        }
        @media (max-width: 600px) {
          .project-list {
            grid-template-columns: 1fr;
          }
          .project-card {
            padding: 16px 10px 12px 10px;
          }
        }
      `}</style>
    </main>
  );
}
