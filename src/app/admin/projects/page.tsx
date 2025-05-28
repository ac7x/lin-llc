"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  name?: string;
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
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-bold text-2xl mb-2">專案管理</h1>
      <p className="text-gray-500 mb-6">這裡是管理所有專案的頁面。</p>
      <Link href="/admin/projects/add">
        <button className="bg-gradient-to-r from-blue-400 to-blue-700 text-white rounded px-6 py-2 font-semibold text-base shadow transition hover:from-blue-700 hover:to-blue-400 mb-4">
          新增專案
        </button>
      </Link>
      <hr className="my-8 border-t border-gray-200" />
      <h2 className="font-semibold text-lg mb-4">專案列表</h2>
      {loading ? (
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
                <span className="text-blue-700 font-bold text-lg hover:underline">{project.name || "(未命名專案)"}</span>
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
