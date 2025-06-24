'use client';
import { useParams } from 'next/navigation';

export default function SubpackagePage() {
  const params = useParams();
  return (
    <main className="p-4">
      <h1 className="text-xl font-bold">
        專案：{params.projectId} / 工作包：{params.packageId} / 子工作包：{params.subpackageId}
      </h1>
    </main>
  );
} 