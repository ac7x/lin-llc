"use client";

import { app } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getUsersList } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

export default function EditProjectPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const db = getFirestore(app);
  const router = useRouter();

  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editMsg, setEditMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [editManager, setEditManager] = useState("");
  const [editSupervisor, setEditSupervisor] = useState<string[]>([]);
  const [editSafety, setEditSafety] = useState<string[]>([]);
  const [editRegion, setEditRegion] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [users, setUsers] = useState<{ uid: string; displayName?: string; email?: string }[]>([]);

  useEffect(() => {
    getUsersList().then(setUsers);
  }, []);

  useEffect(() => {
    async function fetchProject() {
      const projectDoc = await getDoc(doc(db, "projects", projectId));
      if (projectDoc.exists()) {
        setEditName(projectDoc.data().name || "");
        setEditDesc(projectDoc.data().description || "");
        setEditManager(projectDoc.data().manager || "");
        setEditSupervisor(Array.isArray(projectDoc.data().supervisor) ? projectDoc.data().supervisor : projectDoc.data().supervisor ? [projectDoc.data().supervisor] : []);
        setEditSafety(Array.isArray(projectDoc.data().safety) ? projectDoc.data().safety : projectDoc.data().safety ? [projectDoc.data().safety] : []);
        setEditRegion(projectDoc.data().region || "");
        setEditAddress(projectDoc.data().address || "");
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
        manager: editManager,
        supervisor: editSupervisor, // 陣列
        safety: editSafety,         // 陣列
        region: editRegion,
        address: editAddress,
      });
      setEditMsg("儲存成功");
      setTimeout(() => router.back(), 600);
    } catch {
      setEditMsg("儲存失敗");
    }
    setSaving(false);
  }

  return (
    <div className="p-8 max-w-md mx-auto dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 dark:text-gray-100">編輯專案</h1>
      <form onSubmit={handleEditSubmit} className="space-y-4 border p-4 rounded bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
        <div>
          <label className="block mb-1 font-medium dark:text-gray-200">名稱</label>
          <input
            className="border px-2 py-1 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            required
            disabled={saving}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium dark:text-gray-200">描述</label>
          <textarea
            className="border px-2 py-1 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            value={editDesc}
            onChange={e => setEditDesc(e.target.value)}
            rows={2}
            disabled={saving}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium dark:text-gray-200">負責人</label>
          <select className="border px-2 py-1 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" value={editManager} onChange={e => setEditManager(e.target.value)} required disabled={saving}>
            <option value="">請選擇</option>
            {users.map(u => (
              <option key={u.uid} value={u.uid}>{u.displayName || u.email || u.uid}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium dark:text-gray-200">現場監工</label>
          <select
            className="border px-2 py-1 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            value={editSupervisor}
            onChange={e => {
              const options = Array.from(e.target.selectedOptions).map(o => o.value);
              setEditSupervisor(options);
            }}
            multiple
            required
            disabled={saving}
          >
            {users.map(u => (
              <option key={u.uid} value={u.uid}>
                {u.displayName || u.email || u.uid}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium dark:text-gray-200">安全衛生人員</label>
          <select
            className="border px-2 py-1 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            value={editSafety}
            onChange={e => {
              const options = Array.from(e.target.selectedOptions).map(o => o.value);
              setEditSafety(options);
            }}
            multiple
            required
            disabled={saving}
          >
            {users.map(u => (
              <option key={u.uid} value={u.uid}>
                {u.displayName || u.email || u.uid}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium dark:text-gray-200">地區</label>
          <select
            className="border px-2 py-1 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            value={editRegion}
            onChange={e => setEditRegion(e.target.value)}
            required
            disabled={saving}
          >
            <option value="">請選擇</option>
            <option value="北部">北部</option>
            <option value="中部">中部</option>
            <option value="南部">南部</option>
            <option value="東部">東部</option>
            <option value="離島">離島</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium dark:text-gray-200">地址</label>
          <input
            className="border px-2 py-1 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            value={editAddress}
            onChange={e => setEditAddress(e.target.value)}
            required
            disabled={saving}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-1 rounded dark:bg-blue-500"
            disabled={saving}
          >
            {saving ? "儲存中..." : "儲存"}
          </button>
          <button
            type="button"
            className="bg-gray-300 px-4 py-1 rounded dark:bg-gray-600 dark:text-gray-100"
            onClick={() => router.back()}
            disabled={saving}
          >
            取消
          </button>
        </div>
        {editMsg && <div className="text-green-700 dark:text-green-400">{editMsg}</div>}
      </form>
    </div>
  );
}
