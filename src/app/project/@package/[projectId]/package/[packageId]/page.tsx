'use client';
import { useParams } from 'next/navigation';

export default function PackagePage() {
  const params = useParams();
  return (
    <main className="p-4">
      <h1 className="text-xl font-bold">
        專案：{params.projectId} / 工作包：{params.packageId}
      </h1>
      {/* 這裡日後可放子工作包清單 */}
    </main>
  );
} 