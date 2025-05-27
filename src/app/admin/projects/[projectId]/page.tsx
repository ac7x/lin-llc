"use client";

import { app } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { getFirestore, collection, query, orderBy } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { useParams } from "next/navigation";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const db = getFirestore(app);
  const tasksRef = collection(db, "projects", projectId, "tasks");
  const [tasksSnap] = useCollection(query(tasksRef, orderBy("order", "asc")));

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">專案詳細頁</h1>
      <div>專案 ID: {projectId}</div>
      <h2 className="text-lg font-semibold mt-6 mb-2">任務清單</h2>
      <ul className="space-y-2">
        {tasksSnap?.docs.length === 0 && <li className="text-gray-500">尚無任務</li>}
        {tasksSnap?.docs.map(doc => (
          <li key={doc.id} className="border p-2 rounded flex items-center gap-2">
            <span className="flex-1">{doc.data().name}</span>
            <span className="text-xs text-gray-500">{doc.data().status === "done" ? "✅ 已完成" : "⏳ 未完成"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
