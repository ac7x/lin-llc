"use client";

import { useState } from "react";
import { app } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function AddProjectPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const db = getFirestore(app);
  const projectsRef = collection(db, "projects");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setSaving(true);
    try {
      const docRef = await addDoc(projectsRef, {
        name,
        description,
        createdAt: new Date(),
      });
      // 建立 default 初始區域
      const areasRef = collection(db, "projects", docRef.id, "areas");
      await addDoc(areasRef, { name: "default", createdAt: new Date() });
      setMsg("專案建立成功，將自動跳轉...");
      setTimeout(() => router.push(`/admin/projects/${docRef.id}`), 600);
    } catch {
      setMsg("建立失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">新增專案</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">名稱</label>
          <input
            className="border px-2 py-1 w-full"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            disabled={saving}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">描述</label>
          <textarea
            className="border px-2 py-1 w-full"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            disabled={saving}
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={saving}
        >
          {saving ? "建立中..." : "建立專案"}
        </button>
        {msg && <div className="mt-2 text-sm text-green-600">{msg}</div>}
      </form>
    </div>
  );
}
