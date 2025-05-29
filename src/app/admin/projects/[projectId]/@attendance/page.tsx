"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, doc, setDoc, getDocs, Timestamp } from "firebase/firestore";

// 出工人數型別
interface Attendance {
  date: string; // yyyy-mm-dd
  totalWorkers: number;
  details: { role: string; count: number }[];
  createdAt: Timestamp | Date;
}

const defaultRoles = ["coord", "foreman", "safety", "user", "vendor", "helper", "temporary"];

export default function ProjectAttendancePage() {
  const { projectId } = useParams() as { projectId: string };
  // 取得今天日期 yyyy-mm-dd
  const getToday = () => new Date().toISOString().slice(0, 10);
  const [details, setDetails] = useState<{ role: string; count: number }[]>(
    defaultRoles.map(role => ({ role, count: 0 }))
  );
  const [loading, setLoading] = useState(true);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 取得歷史出工紀錄
  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    getDocs(collection(db, "projects", projectId, "attendances"))
      .then(snap => {
        setAttendances(
          snap.docs.map(doc => ({ ...doc.data() })) as Attendance[]
        );
      })
      .finally(() => setLoading(false));
  }, [projectId, success]);

  // 處理細項人數變更
  const handleDetailChange = (role: string, value: number) => {
    setDetails(details =>
      details.map(d =>
        d.role === role ? { ...d, count: value } : d
      )
    );
  };

  // 儲存出工紀錄
  const handleSave = async () => {
    const today = getToday();
    const totalWorkers = details.reduce((sum, d) => sum + d.count, 0);
    if (totalWorkers < 0) {
      setError("人數不可為負");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await setDoc(doc(db, "projects", projectId, "attendances", today), {
        date: today,
        totalWorkers,
        details,
        createdAt: new Date(),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1200);
    } catch {
      setError("儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-xl font-bold mb-4">每日出工人數紀錄</h2>
      <div className="mb-4 flex gap-4 items-end">
        <div>
          <label className="block font-medium mb-1">日期：</label>
          <span className="px-2 py-1">{getToday()}</span>
        </div>
        <div>
          <label className="block font-medium mb-1">總人數：</label>
          <span className="px-2 py-1">{details.reduce((sum, d) => sum + d.count, 0)}</span>
        </div>
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-1">各工種人數：</label>
        <div className="flex flex-col gap-2">
          {details.map((d) => (
            <div key={d.role} className="flex items-center gap-1">
              <span>{d.role}：</span>
              <input
                type="number"
                min={0}
                value={d.count}
                onChange={e => handleDetailChange(d.role, Number(e.target.value))}
                className="border rounded px-2 py-1 w-16"
              />
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-blue-700 hover:bg-blue-800 text-white rounded px-6 py-2 font-semibold text-base transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? "儲存中..." : "儲存"}
      </button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {success && <div className="text-green-600 mt-2">已儲存！</div>}
      <hr className="my-8" />
      <h3 className="text-lg font-semibold mb-2">歷史出工紀錄</h3>
      {loading ? (
        <div>載入中...</div>
      ) : (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">日期</th>
              <th className="border px-2 py-1">總人數</th>
              <th className="border px-2 py-1">各工種</th>
            </tr>
          </thead>
          <tbody>
            {attendances.sort((a, b) => b.date.localeCompare(a.date)).map(a => (
              <tr key={a.date}>
                <td className="border px-2 py-1">{a.date}</td>
                <td className="border px-2 py-1">{a.totalWorkers}</td>
                <td className="border px-2 py-1">
                  {a.details && a.details.length > 0
                    ? a.details.map(d => `${d.role}:${d.count}`).join("，")
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
