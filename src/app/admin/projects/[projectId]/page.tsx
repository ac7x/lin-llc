"use client";

import { useParams } from "next/navigation";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">專案詳細頁</h1>
      <div>專案 ID: {projectId}</div>
      {/* 可在此顯示專案詳細資料 */}
    </div>
  );
}
