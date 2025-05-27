"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs } from "firebase/firestore";
import Timeline from "react-calendar-timeline";
import "react-calendar-timeline/style.css";
import { subDays, addDays, startOfDay, endOfDay } from "date-fns";

type Group = {
  id: string;
  title: string;
};

type Project = {
  id: string;
  name: string;
};

type ScheduleItem = {
  id: string;
  group: string; // userId
  title: string; // project name
  start_time: number;
  end_time: number;
  projectId: string;
  userId: string;
};

export default function UserSchedulePage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [items, setItems] = useState<ScheduleItem[]>([]);
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
        setGroups(groupsData);

        // 取得 projects
        const projectsSnap = await getDocs(collection(db, "projects"));
        const projectsData: Project[] = projectsSnap.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || "未命名專案",
        }));

        // 取得 schedules
        const schedulesSnap = await getDocs(collection(db, "schedules"));
        const itemsData: ScheduleItem[] = schedulesSnap.docs.map((doc) => {
          const data = doc.data();
          const project = projectsData.find((p) => p.id === data.projectId);
          return {
            id: doc.id,
            group: data.userId,
            title: project ? project.name : "未知專案",
            start_time: data.start ? data.start.toMillis() : Date.now(),
            end_time: data.end ? data.end.toMillis() : Date.now() + 24 * 60 * 60 * 1000,
            projectId: data.projectId,
            userId: data.userId,
          };
        });
        setItems(itemsData);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError("載入失敗");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 計算顯示區間
  const now = new Date();
  const defaultTimeStart = subDays(startOfDay(now), 2);
  const defaultTimeEnd = addDays(endOfDay(now), 5);

  return (
    <main>
      <h1>專案時程表</h1>
      <p>以時間軸方式檢視所有專案日程。</p>
      {loading && <div>載入中...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      {!loading && !error && (
        <Timeline
          groups={groups}
          items={items}
          defaultTimeStart={defaultTimeStart.getTime()}
          defaultTimeEnd={defaultTimeEnd.getTime()}
        />
      )}
    </main>
  );
}
