"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs, addDoc, doc, updateDoc } from "firebase/firestore";
import Timeline from "react-calendar-timeline";
import "react-calendar-timeline/style.css";
import { subDays, addDays, startOfDay, endOfDay } from "date-fns";
import { auth } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { useAuthState } from "react-firebase-hooks/auth";

type Group = {
  id: string;
  title: string;
};

type Item = {
  id: string;
  group: string;
  title: string;
  start_time: number;
  end_time: number;
};

export default function ProjectsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user] = useAuthState(auth);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 取得 users 作為 groups
        const usersSnap = await getDocs(collection(db, "users"));
        const groupsData: Group[] = usersSnap.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().displayName || doc.data().name || doc.id,
        }));

        // 取得 projects 作為 items
        const projectsSnap = await getDocs(collection(db, "projects"));
        const itemsData: Item[] = projectsSnap.docs.map((doc) => {
          const data = doc.data();
          // 預設時間區間
          const start = data.createdAt?.toDate?.() || new Date();
          const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
          return {
            id: doc.id,
            group: data.createdBy || groupsData[0]?.id || "unknown",
            title: data.name || "未命名專案",
            start_time: start.getTime(),
            end_time: end.getTime(),
          };
        });

        setGroups(groupsData);
        setItems(itemsData);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("載入失敗");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateProject = async () => {
    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(false);
    try {
      await addDoc(collection(db, "projects"), {
        name: "新專案",
        createdAt: new Date(),
        createdBy: user?.uid || null,
      });
      setCreateSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCreateError(err.message);
      } else {
        setCreateError("建立專案失敗");
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAssignProject = async (projectId: string, userId: string) => {
    try {
      await updateDoc(doc(db, "projects", projectId), {
        createdBy: userId,
      });
      // 重新載入資料
      window.location.reload();
    } catch {
      alert("指派失敗");
    }
  };

  // 計算顯示區間
  const now = new Date();
  const defaultTimeStart = subDays(startOfDay(now), 2);
  const defaultTimeEnd = addDays(endOfDay(now), 5);

  return (
    <main>
      <h1>專案時程表</h1>
      <p>以時間軸方式檢視所有專案。</p>
      <button onClick={handleCreateProject} disabled={createLoading || !user}>
        {createLoading ? "建立中..." : "建立專案"}
      </button>
      {createError && <div style={{ color: "red" }}>{createError}</div>}
      {createSuccess && <div style={{ color: "green" }}>專案已建立！請重新整理查看。</div>}
      {loading && <div>載入中...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      {!loading && !error && (
        <>
          <Timeline
            groups={groups}
            items={items}
            defaultTimeStart={defaultTimeStart.getTime()}
            defaultTimeEnd={defaultTimeEnd.getTime()}
          />
          <h2>快速指派地點給用戶</h2>
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                {item.title}{" "}
                <select
                  value={item.group}
                  onChange={(e) => handleAssignProject(item.id, e.target.value)}
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
