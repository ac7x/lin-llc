"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

type Project = {
  id: string;
  name?: string;
};

export default function ProjectEditPage() {
  const { projectId } = useParams() as { projectId: string };
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      setLoading(true);
      const ref = doc(db, "projects", projectId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setProject({ id: snap.id, ...data });
        setName(data.name || "");
      }
      setLoading(false);
    };
    fetchProject();
  }, [projectId]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("名稱不能為空");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await updateDoc(doc(db, "projects", projectId), { name });
      setSuccess(true);
      // 可選：自動返回上一頁
      // router.push(`/admin/projects/${projectId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main>載入中...</main>;
  if (!project) return <main>找不到專案</main>;

  return (
    <main>
      <h1>編輯專案</h1>
      <div>
        <label>
          名稱：
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={saving}
            style={{ marginLeft: 8 }}
          />
        </label>
      </div>
      <button onClick={handleSave} disabled={saving || !name.trim()} style={{ marginTop: 12 }}>
        {saving ? "儲存中..." : "儲存"}
      </button>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {success && <div style={{ color: "green" }}>儲存成功！</div>}
      <div style={{ marginTop: 16 }}>
        <button onClick={() => router.push(`/admin/projects/${projectId}`)}>返回專案詳情</button>
      </div>
    </main>
  );
}
