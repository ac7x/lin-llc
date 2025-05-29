"use client";

import React, { useEffect, useState, useRef } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs } from "firebase/firestore";
import { Timeline, DataSet } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.css";

type Group = { id: string; content: string };
type FlowItem = {
  id: string;
  group: string;
  content: string;
  start: Date;
  end: Date;
  projectId: string;
  userId?: string;
};

export default function UserSchedulePage() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstance = useRef<Timeline | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [items, setItems] = useState<FlowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const projectsSnap = await getDocs(collection(db, "projects"));
        const loadedGroups = projectsSnap.docs.map((doc) => ({
          id: doc.id,
          content: doc.data().projectName || doc.id, // 取 projectName 欄位
        }));
        setGroups(loadedGroups);

        const loadedItems: FlowItem[] = [];
        await Promise.all(
          projectsSnap.docs.map(async (projectDoc) => {
            const projectName = projectDoc.data().name || projectDoc.id;
            const flowsSnap = await getDocs(
              collection(db, "projects", projectDoc.id, "flows")
            );
            flowsSnap.docs.forEach((doc) => {
              const d = doc.data();
              loadedItems.push({
                id: doc.id,
                group: projectName,
                content: d.name || `流程 (${projectName})`,
                start:
                  d.start?.toDate?.() ?? new Date(d.start ?? Date.now()),
                end:
                  d.end?.toDate?.() ??
                  new Date(d.end ?? Date.now() + 86400000),
                projectId: projectDoc.id,
                userId: d.userId,
              });
            });
          })
        );
        setItems(loadedItems);
      } catch (e) {
        setError((e as Error).message || "載入資料失敗");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (
      !timelineRef.current ||
      loading ||
      error ||
      !groups.length ||
      !items.length
    )
      return;
    timelineInstance.current?.destroy();
    const container = timelineRef.current;
    const groupsDataSet = new DataSet(groups);
    const itemsDataSet = new DataSet(items);
    timelineInstance.current = new Timeline(
      container,
      itemsDataSet,
      groupsDataSet,
      {
        editable: false,
        orientation: { axis: "both", item: "top" },
      }
    );
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 3);
    const end = new Date(today);
    end.setDate(today.getDate() + 4);
    timelineInstance.current.setWindow(start, end);
    timelineInstance.current.moveTo(today, { animation: false });
    return () => {
      timelineInstance.current?.destroy();
      timelineInstance.current = null;
    };
  }, [items, groups, loading, error]);

  return (
    <main>
      <h1>時程表</h1>
      {loading && <p>載入中...</p>}
      {error && <p style={{ color: "red" }}>錯誤：{error}</p>}
      {!loading && !error && <div ref={timelineRef} style={{ height: 600 }} />}
    </main>
  );
}
