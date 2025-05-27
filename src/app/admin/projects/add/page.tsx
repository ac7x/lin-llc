"use client";

import { useState, useEffect } from "react";
import { app } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { getUsersList } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

export default function AddProjectPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [manager, setManager] = useState("");
  const [supervisor, setSupervisor] = useState<string[]>([]);
  const [safety, setSafety] = useState<string[]>([]);
  const [region, setRegion] = useState("");
  const [address, setAddress] = useState("");
  const [users, setUsers] = useState<{ uid: string; displayName?: string; email?: string }[]>([]);
  const router = useRouter();

  const db = getFirestore(app);
  const projectsRef = collection(db, "projects");

  // 載入 users
  useEffect(() => {
    getUsersList().then(setUsers);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setSaving(true);
    try {
      const docRef = await addDoc(projectsRef, {
        name,
        description,
        manager,
        supervisor, // 陣列
        safety,     // 陣列
        region,
        address,
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
    <div className="p-8 max-w-md mx-auto dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 dark:text-gray-100">新增專案</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium dark:text-gray-200">名稱</label>
          <input
            className="border px-2 py-1 w-full dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            disabled={saving}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium dark:text-gray-200">描述</label>
          <textarea
            className="border px-2 py-1 w-full dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            disabled={saving}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium dark:text-gray-200">負責人</label>
          <select
            className="border px-2 py-1 w-full dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            value={manager}
            onChange={e => setManager(e.target.value)}
            required
            disabled={saving}
          >
            <option value="">請選擇</option>
            {users.map(u => (
              <option key={u.uid} value={u.uid}>
                {u.displayName || u.email || u.uid}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium dark:text-gray-200">現場監工</label>
          <select
            className="border px-2 py-1 w-full dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            value={supervisor}
            onChange={e => {
              const options = Array.from(e.target.selectedOptions).map(o => o.value);
              setSupervisor(options);
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
            className="border px-2 py-1 w-full dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            value={safety}
            onChange={e => {
              const options = Array.from(e.target.selectedOptions).map(o => o.value);
              setSafety(options);
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
            className="border px-2 py-1 w-full dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            value={region}
            onChange={e => setRegion(e.target.value)}
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
            className="border px-2 py-1 w-full dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            value={address}
            onChange={e => setAddress(e.target.value)}
            required
            disabled={saving}
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded dark:bg-blue-500"
          disabled={saving}
        >
          {saving ? "建立中..." : "建立專案"}
        </button>
        {msg && <div className="mt-2 text-sm text-green-600 dark:text-green-400">{msg}</div>}
      </form>
    </div>
  );
}
