"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

type Project = {
  id: string;
  name?: string;
  coord?: string; // 協調者
  foreman?: string[]; // 監工
  safety?: string[]; // 安全人員
  region?: string;
  address?: string;
  startDate?: string | null;
  endDate?: string | null;
};

export default function ProjectEditPage() {
  const { projectId } = useParams() as { projectId: string };
  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [coord, setCoord] = useState("");
  const [foreman, setForeman] = useState<string[]>([]);
  const [safety, setSafety] = useState<string[]>([]);
  const [region, setRegion] = useState("");
  const [address, setAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [peopleOptions, setPeopleOptions] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const regionOptions = ["北部", "中部", "南部", "東部", "離島"];

  useEffect(() => {
    // 取得 users 集合
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      setPeopleOptions(
        snap.docs.map(doc => {
          const data = doc.data();
          return { id: doc.id, name: data.displayName || data.name || doc.id };
        })
      );
    };
    fetchUsers();
  }, []);

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
        setCoord(data.coord || "");
        setForeman(data.foreman || []);
        setSafety(data.safety || []);
        setRegion(data.region || "");
        setAddress(data.address || "");
        setStartDate(data.startDate || "");
        setEndDate(data.endDate || "");
      }
      setLoading(false);
    };
    fetchProject();
  }, [projectId]);

  const handleMultiSelect = (
    value: string,
    selected: string[],
    setSelected: (v: string[]) => void
  ) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((v) => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("名稱不能為空");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await updateDoc(doc(db, "projects", projectId), {
        name,
        coord,
        foreman,
        safety,
        region,
        address,
        startDate: startDate || null,
        endDate: endDate || null,
      });
      setSuccess(true);
      // router.push(`/admin/projects/${projectId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="p-8">載入中...</main>;
  if (!project) return <main className="p-8">找不到專案</main>;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-4">
        <label className="block font-medium mb-1">
          名稱：
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={saving}
            className="ml-2 px-3 py-2 border border-gray-300 rounded w-72 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </label>
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-1">
          地區：
          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            disabled={saving}
            className="ml-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">請選擇</option>
            {regionOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-1">
          地址：
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            disabled={saving}
            className="ml-2 px-3 py-2 border border-gray-300 rounded w-80 focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="請輸入地址"
          />
        </label>
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-1">
          協調者（單選）：
          <select
            value={coord}
            onChange={e => setCoord(e.target.value)}
            disabled={saving}
            className="ml-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">請選擇</option>
            {peopleOptions.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-1">監工 foreman（可複選）：</label>
        <div className="flex flex-wrap gap-4">
          {peopleOptions.map(p => (
            <label key={p.id} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={foreman.includes(p.id)}
                onChange={() => handleMultiSelect(p.id, foreman, setForeman)}
                disabled={saving}
                className="accent-blue-600"
              />
              {p.name}
            </label>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-1">安全人員 safety（可複選）：</label>
        <div className="flex flex-wrap gap-4">
          {peopleOptions.map(p => (
            <label key={p.id} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={safety.includes(p.id)}
                onChange={() => handleMultiSelect(p.id, safety, setSafety)}
                disabled={saving}
                className="accent-blue-600"
              />
              {p.name}
            </label>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-1">
          起始日：
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            disabled={saving}
            className="ml-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </label>
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-1">
          預估結束日：
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            disabled={saving}
            className="ml-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </label>
      </div>
      <button
        onClick={handleSave}
        disabled={saving || !name.trim()}
        className="bg-blue-700 hover:bg-blue-800 text-white rounded px-6 py-2 font-semibold text-base transition mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? "儲存中..." : "儲存"}
      </button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {success && <div className="text-green-600 mt-2">儲存成功！</div>}
    </main>
  );
}
