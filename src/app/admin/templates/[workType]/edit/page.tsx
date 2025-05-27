"use client";

import { useEffect, useState } from "react";
import { app } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";

export default function EditWorkTypePage() {
  const params = useParams();
  const router = useRouter();
  const workTypeId = params?.workType as string;
  const db = getFirestore(app);
  const workTypeRef = doc(db, "templates", workTypeId);

  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const snap = await getDoc(workTypeRef);
      if (snap.exists()) {
        setForm({
          name: snap.data().name || "",
          description: snap.data().description || "",
        });
      }
      setLoading(false);
    }
    fetchData();
  }, [workTypeId, workTypeRef]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      await updateDoc(workTypeRef, { name: form.name, description: form.description });
      setMsg("儲存成功");
      setTimeout(() => router.push(`/admin/templates/${workTypeId}`), 800);
    } catch {
      setMsg("儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">載入中...</div>;

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">編輯施工種類（範本）</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">名稱</label>
          <input
            className="border px-2 py-1 w-full"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
            disabled={saving}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">描述</label>
          <textarea
            className="border px-2 py-1 w-full"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            disabled={saving}
          />
        </div>
        <button
          type="submit"
          className="bg-yellow-600 text-white px-4 py-2 rounded"
          disabled={saving}
        >
          {saving ? "儲存中..." : "儲存"}
        </button>
        {msg && <div className="mt-2 text-sm text-green-600">{msg}</div>}
      </form>
    </div>
  );
}
