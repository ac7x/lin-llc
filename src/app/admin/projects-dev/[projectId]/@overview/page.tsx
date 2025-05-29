"use client";

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

export default function ProjectDetailPage() {
  const { projectId } = useParams() as { projectId: string };
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<{ [key: string]: string }>({});

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

  if (loading) return <div className="p-8">載入中...</div>;
  if (!project) return <div className="p-8">找不到專案</div>;

  return (
    <div className="mb-4 text-gray-600">
      <div>協調者：{users[project.coord || ""] || "-"}</div>
      <div>監工：{project.foreman?.map(id => users[id] || id).join(", ") || "-"}</div>
      <div>安全人員：{project.safety?.map(id => users[id] || id).join(", ") || "-"}</div>
      <div>地區：{project.region || "-"}</div>
      <div>地址：{project.address || "-"}</div>
      <div>起始日：{project.startDate || "-"}</div>
      <div>預估結束日：{project.endDate || "-"}</div>
      <div>業主：{project.ownerName || "-"}</div>
      <div>預算：{project.budget?.toLocaleString() || "-"}</div>
      <div>已支出：{project.totalSpent?.toLocaleString() || "-"}</div>
      <div>剩餘預算：{project.remainingBudget?.toLocaleString() || "-"}</div>
      {project.expenses && project.expenses.length > 0 && (
        <div>
          支出明細：
          <ul className="list-disc ml-5">
            {project.expenses.map(e => (
              <li key={e.id}>
                {e.name} - {e.amount.toLocaleString()} 元 ({e.date})
                {e.note && `，備註：${e.note}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
