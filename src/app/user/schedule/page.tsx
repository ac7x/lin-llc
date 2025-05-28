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

    Promise.all([
      getDocs(collection(db, "projects")),
      getDocs(collection(db, "flows"))
    ]).then(([projectsSnap, flowsSnap]) => {
      const groupList = projectsSnap.docs.map(doc => ({
        id: doc.id,
        content: doc.data().name || `專案 ${doc.id}`,
      }));
      setGroups(groupList);

      const projectsData = projectsSnap.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || "未命名專案",
      }));

      const itemList = flowsSnap.docs.map(doc => {
        const d = doc.data();
        const projectForFlow = projectsData.find(p => p.id === d.projectId);
        return {
          id: doc.id,
          group: d.projectId,
          content: d.name || (projectForFlow ? `流程 (${projectForFlow.name})` : "未命名流程"),
          start: d.start ? d.start.toDate() : new Date(),
          end: d.end ? d.end.toDate() : new Date(Date.now() + 86400000),
          projectId: d.projectId,
          userId: d.userId,
        };
      });
      setItems(itemList);

    }).catch((err: unknown) => {
      setError((err as Error).message || "載入資料失敗");
    }).finally(() => {
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
      <h1>專案時程表</h1>
      {loading && <div>載入中...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      {!loading && !error && (
        <div ref={timelineRef} style={{ height: "600px" }} />
      )}
    </main>
  );
}