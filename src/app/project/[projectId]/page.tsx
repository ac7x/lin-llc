'use client';
import { useParams } from 'next/navigation';

export default function ProjectPage() {
  const params = useParams();
  return (
    <main className="p-4">
      <h1 className="text-xl font-bold">專案：{params.projectId}</h1>
      {/* 這裡日後可放工作包清單 */}
    </main>
  );
} 