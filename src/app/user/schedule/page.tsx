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
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. 取得所有專案
        const projectsSnap = await getDocs(collection(db, "projects"));
        const projectGroups: Group[] = projectsSnap.docs.map(docSnapshot => ({
          id: docSnapshot.id,
          content: docSnapshot.data().name || `專案 ${docSnapshot.id}`,
        }));
        setGroups(projectGroups);

        // 2. 取得所有流程
        const projectsData = projectsSnap.docs.map(docSnapshot => ({
          id: docSnapshot.id,
          name: docSnapshot.data().name || "未命名專案",
        }));
        const flowsSnap = await getDocs(collection(db, "flows"));
        const flowItems: FlowItem[] = flowsSnap.docs.map(docSnapshot => {
          const d = docSnapshot.data();
          const projectForFlow = projectsData.find(p => p.id === d.projectId);
          return {
            id: docSnapshot.id,
            group: d.projectId,
            content: d.name || (projectForFlow ? `流程 (${projectForFlow.name})` : "未命名流程"),
            start: d.start ? d.start.toDate() : new Date(),
            end: d.end ? d.end.toDate() : new Date(Date.now() + 86400000),
            projectId: d.projectId,
            userId: d.userId,
          };
        });
        setItems(flowItems);
      } catch (err: unknown) {
        setError((err as Error).message || "載入資料失敗");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!timelineRef.current || loading || error) return;
    const container = timelineRef.current;
    const groupsDataSet = new DataSet<Group, 'id'>(groups);
    const itemsDataSet = new DataSet<FlowItem, 'id'>(items);
    const options: TimelineOptions = {
      editable: false, // 只讀模式
      orientation: {
        axis: "both",
        item: "top",
      },
    };
    try {
      timelineInstance.current = new Timeline(container, itemsDataSet, groupsDataSet, options);
    } catch (err) {
      console.error("Timeline 初始化失敗:", err);
    }
    return () => {
      if (timelineInstance.current) {
        timelineInstance.current.destroy();
      }
    };
  }, [loading, error, items, groups]);

  return (
    <main>
      <h1>專案時程表</h1>
      <p>以時間軸方式檢視所有專案日程（僅檢視，無法編輯）。</p>
      {loading && <div>載入中...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      {!loading && !error && (
        <div ref={timelineRef} style={{ height: "600px" }} />
      )}
    </main>
  );
}
