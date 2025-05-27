"use client";

import { app } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function EditProjectPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const db = getFirestore(app);
  const router = useRouter();

  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editMsg, setEditMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchProject() {
      const projectDoc = await getDoc(doc(db, "projects", projectId));
      if (projectDoc.exists()) {
        setEditName(projectDoc.data().name || "");
        setEditDesc(projectDoc.data().description || "");
      }
    }
    if (projectId) fetchProject();
  }, [db, projectId]);

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setEditMsg("");
    try {
      await updateDoc(doc(db, "projects", projectId), {
        name: editName,
        description: editDesc,
      });
      setEditMsg("儲存成功");
      setTimeout(() => router.back(), 600);
    } catch {
      setEditMsg("儲存失敗");
    }
    setSaving(false);
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">編輯專案</h1>
      <form onSubmit={handleEditSubmit} className="space-y-4 border p-4 rounded bg-gray-50">
        <div>
          <label className="block mb-1 font-medium">名稱</label>
          <input
            className="border px-2 py-1 w-full"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            required
            disabled={saving}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">描述</label>
          <textarea
            className="border px-2 py-1 w-full"
            value={editDesc}
            onChange={e => setEditDesc(e.target.value)}
            rows={2}
            disabled={saving}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-1 rounded"
            disabled={saving}
          >
            {saving ? "儲存中..." : "儲存"}
          </button>
          <button
            type="button"
            className="bg-gray-300 px-4 py-1 rounded"
            onClick={() => router.back()}
            disabled={saving}
          >
            取消
          </button>
        </div>
        {editMsg && <div className="text-green-700">{editMsg}</div>}
      </form>
    </div>
  );
}
