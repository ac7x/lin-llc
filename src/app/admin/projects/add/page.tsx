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
  const [manager, setManager] = useState("");
  const [supervisors, setSupervisors] = useState<string[]>([]);
  const [safetyStaff, setSafetyStaff] = useState<string[]>([]);
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
    // 可選欄位驗證（可依需求加強）
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await addDoc(collection(db, "projects"), {
        name: projectName,
        createdAt: new Date(),
        createdBy: user?.uid || null,
        manager,
        supervisors,
        safetyStaff,
        region,
        address,
        startDate: startDate || null,
        endDate: endDate || null,
      });
      setSuccess(true);
      setProjectName("");
      setManager("");
      setSupervisors([]);
      setSafetyStaff([]);
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
    <main>
      <h1>新增專案</h1>
      <div>
        <input
          type="text"
          placeholder="請輸入專案名稱"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          disabled={loading}
          style={{ marginRight: 8 }}
        />
      </div>
      <div style={{ margin: "12px 0" }}>
        <label>
          地區：
          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            disabled={loading}
            style={{ marginLeft: 8 }}
          >
            <option value="">請選擇</option>
            {regionOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </label>
      </div>
      <div style={{ margin: "12px 0" }}>
        <label>
          地址：
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            disabled={loading}
            style={{ marginLeft: 8, width: 300 }}
            placeholder="請輸入地址"
          />
        </label>
      </div>
      <div style={{ margin: "12px 0" }}>
        <label>
          負責人（單選）：
          <select
            value={manager}
            onChange={e => setManager(e.target.value)}
            disabled={loading}
            style={{ marginLeft: 8 }}
          >
            <option value="">請選擇</option>
            {peopleOptions.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
      </div>
      <div style={{ margin: "12px 0" }}>
        <label>現場監工（可複選）：</label>
        <div>
          {peopleOptions.map(p => (
            <label key={p.id} style={{ marginRight: 12 }}>
              <input
                type="checkbox"
                checked={supervisors.includes(p.id)}
                onChange={() => handleMultiSelect(p.id, supervisors, setSupervisors)}
                disabled={loading}
              />
              {p.name}
            </label>
          ))}
        </div>
      </div>
      <div style={{ margin: "12px 0" }}>
        <label>現場公共安全人員（可複選）：</label>
        <div>
          {peopleOptions.map(p => (
            <label key={p.id} style={{ marginRight: 12 }}>
              <input
                type="checkbox"
                checked={safetyStaff.includes(p.id)}
                onChange={() => handleMultiSelect(p.id, safetyStaff, setSafetyStaff)}
                disabled={loading}
              />
              {p.name}
            </label>
          ))}
        </div>
      </div>
      <div style={{ margin: "12px 0" }}>
        <label>
          起始日：
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            disabled={loading}
            style={{ marginLeft: 8 }}
          />
        </label>
      </div>
      <div style={{ margin: "12px 0" }}>
        <label>
          預估結束日：
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            disabled={loading}
            style={{ marginLeft: 8 }}
          />
        </label>
      </div>
      <button onClick={handleCreateProject} disabled={loading || !user}>
        {loading ? "建立中..." : "建立專案"}
      </button>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {success && <div style={{ color: "green" }}>專案已建立！即將返回列表...</div>}
      <div style={{ marginTop: 16 }}>
        <button onClick={() => router.push("/admin/projects")}>返回專案列表</button>
      </div>
    </main>
  );
}
