"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { useRouter } from "next/navigation";

export default function ProjectAddPage() {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [projectName, setProjectName] = useState("");
  // 新增欄位狀態
  const [coord, setCoord] = useState("");
  const [foreman, setForeman] = useState<string[]>([]);
  const [safety, setSafety] = useState<string[]>([]);
  const [region, setRegion] = useState("");
  const [address, setAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // 從 users 集合取得人員名單
  const [peopleOptions, setPeopleOptions] = useState<{ id: string; name: string }[]>([]);
  const router = useRouter();

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

  const regionOptions = ["北部", "中部", "南部", "東部", "離島"];

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setError("請輸入專案名稱");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await addDoc(collection(db, "projects"), {
        name: projectName,
        createdAt: new Date(),
        createdBy: user?.uid || null,
        coord,
        foreman,
        safety,
        region,
        address,
        startDate: startDate || null,
        endDate: endDate || null,
      });
      setSuccess(true);
      setProjectName("");
      setCoord("");
      setForeman([]);
      setSafety([]);
      setRegion("");
      setAddress("");
      setStartDate("");
      setEndDate("");
      setTimeout(() => {
        router.push("/admin/projects");
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("建立專案失敗");
      }
    } finally {
      setLoading(false);
    }
  };

  // 處理多選
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

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">新增專案</h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="請輸入專案名稱"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          disabled={loading}
          className="px-3 py-2 border border-gray-300 rounded w-72 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-1">
          地區：
          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
            className="ml-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </label>
      </div>
      <button
        onClick={handleCreateProject}
        disabled={loading || !user}
        className="bg-blue-700 hover:bg-blue-800 text-white rounded px-6 py-2 font-semibold text-base transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "建立中..." : "建立專案"}
      </button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {success && <div className="text-green-600 mt-2">專案已建立！即將返回列表...</div>}
      <div className="mt-6">
        <button
          onClick={() => router.push("/admin/projects")}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded px-6 py-2 font-semibold text-base transition"
        >
          返回專案列表
        </button>
      </div>
    </main>
  );
}
