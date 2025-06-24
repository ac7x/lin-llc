import { useParams } from 'next/navigation';

export default function TaskPackagePage() {
  const params = useParams();
  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">任務包詳情頁</h1>
      <div>taskpackageId: {params.taskpackageId as string}</div>
    </main>
  );
} 