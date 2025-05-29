// app/admin/projects/[projectId]/layout.tsx
import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";

export default function ProjectLayout({
  children,
  overview,
  journal,
  flow,
  zones,
  schedule,
  attendance,
  edit,
}: {
  children: React.ReactNode;
  overview: React.ReactNode;
  journal: React.ReactNode;
  flow: React.ReactNode;
  zones: React.ReactNode;
  schedule: React.ReactNode;
  attendance: React.ReactNode;
  edit: React.ReactNode;
}) {
  const tabs = [
    { label: "專案總覽", key: "overview" },
    { label: "進度日誌", key: "journal" },
    { label: "流程管理", key: "flow" },
    { label: "分區管理", key: "zones" },
    { label: "排程視覺化", key: "schedule" },
    { label: "出工紀錄", key: "attendance" },
    { label: "編輯專案", key: "edit" },
  ];

  const { projectId } = useParams() as { projectId: string };

  return (
    <div className="flex max-w-6xl mx-auto px-12 py-8 gap-6">
      {/* 左側側邊欄 */}
      <aside className="w-44 shrink-0 border-r pr-4 ml-20">
        <nav className="flex flex-col gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={`/admin/projects/${projectId}/${tab.key}`}
              className="text-left px-3 py-2 rounded hover:bg-blue-50 font-medium transition text-gray-700"
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* 右側 slot 注入 */}
      <main className="flex-1 min-w-0">
        {children}
        {overview}
        {journal}
        {flow}
        {zones}
        {schedule}
        {attendance}
        {edit}
      </main>
    </div>
  );
}