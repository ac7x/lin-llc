"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs } from "firebase/firestore";
import Timeline from "react-calendar-timeline";
import "react-calendar-timeline/style.css";

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

  return (
    <main>
      <h1>專案時程表</h1>
      <p>以時間軸方式檢視所有專案。</p>
      {loading && <div>載入中...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      {!loading && !error && (
        <Timeline
          groups={groups}
          items={items}
          defaultTimeStart={Date.now() - 7 * 24 * 60 * 60 * 1000}
          defaultTimeEnd={Date.now() + 7 * 24 * 60 * 60 * 1000}
        />
      )}
    </main>
  );
}
