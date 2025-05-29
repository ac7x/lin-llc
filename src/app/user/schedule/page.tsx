"use client";

import React, { useEffect, useState, useRef } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs } from "firebase/firestore";
import { Timeline, DataSet, TimelineOptions } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.css";

// Group = Project
// FlowItem = 流程
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
  const [groups, setGroups] = useState<Group[]>([]);
  const [items, setItems] = useState<FlowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstance = useRef<Timeline | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // 先取得所有 projects，再取得每個 project 的 flows 子集合
    getDocs(collection(db, "projects"))
      .then(async (projectsSnap) => {
        const groupList = projectsSnap.docs.map(doc => ({
          id: doc.id,
          content: doc.data().name || doc.id,
        }));
        setGroups(groupList);

        // 取得所有 flows 子集合
        const allFlows: FlowItem[] = [];
        await Promise.all(
          projectsSnap.docs.map(async (projectDoc) => {
            const projectName = projectDoc.data().name || projectDoc.id;
            const flowsSnap = await getDocs(collection(db, "projects", projectDoc.id, "flows"));
            flowsSnap.docs.forEach(doc => {
              const d = doc.data();
              allFlows.push({
                id: doc.id,
                group: projectName, // 這裡改為 project name（已無前綴）
                content: d.name || (projectDoc.data().name ? `流程 (${projectDoc.data().name})` : "未命名流程"),
                start: d.start ? (typeof d.start.toDate === 'function' ? d.start.toDate() : new Date(d.start)) : new Date(),
                end: d.end ? (typeof d.end.toDate === 'function' ? d.end.toDate() : new Date(d.end)) : new Date(Date.now() + 86400000),
                projectId: projectDoc.id,
                userId: d.userId,
              });
            });
          })
        );
        setItems(allFlows);
      })
      .catch((err: unknown) => {
        setError((err as Error).message || "載入資料失敗");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!timelineRef.current || loading || error) return;
    const container = timelineRef.current;
    const groupsDataSet = new DataSet(groups);
    const itemsDataSet = new DataSet(items);
    const options: TimelineOptions = {
      editable: false,
      orientation: { axis: "both", item: "top" }
    };
    timelineInstance.current = new Timeline(container, itemsDataSet, groupsDataSet, options);
    return () => {
      timelineInstance.current?.destroy();
    };
  }, [loading, error, items, groups]);

  return (
    <main>
      <h1>時程表</h1>
      {loading && <div>載入中...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      {!loading && !error && (
        <div ref={timelineRef} style={{ height: "600px" }} />
      )}
    </main>
  );
}