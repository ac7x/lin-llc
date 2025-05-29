"use client";

import React, { useEffect, useRef } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, onSnapshot } from "firebase/firestore";
import { Timeline, DataSet } from "vis-timeline/standalone";

export default function UserSchedulePage() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstance = useRef<Timeline | null>(null);

  useEffect(() => {
    let unsubProjects: (() => void) | null = null;
    let unsubFlows: (() => void)[] = [];
    let groups: any[] = [];
    let items: any[] = [];

    if (!timelineRef.current) return;

    const renderTimeline = () => {
      timelineInstance.current?.destroy();
      timelineInstance.current = new Timeline(
        timelineRef.current!,
        new DataSet(items),
        new DataSet(groups),
        { editable: false }
      );
    };

    unsubProjects = onSnapshot(collection(db, "projects"), (projectSnap) => {
      groups = projectSnap.docs.map((doc) => ({
        id: doc.id,
        content: doc.data().projectName || doc.id,
      }));

      items = [];
      unsubFlows.forEach((u) => u());
      unsubFlows = projectSnap.docs.map((projectDoc) =>
        onSnapshot(
          collection(db, "projects", projectDoc.id, "flows"),
          (flowSnap) => {
            // 清空同群組舊資料
            items = items.filter((i) => i.group !== projectDoc.id);
            flowSnap.docs.forEach((doc) => {
              const d = doc.data();
              items.push({
                id: doc.id,
                group: projectDoc.id,
                content: d.name || "流程",
                start: d.start?.toDate?.() ?? new Date(d.start ?? Date.now()),
                end: d.end?.toDate?.() ?? new Date(d.end ?? Date.now() + 86400000),
              });
            });
            renderTimeline();
          }
        )
      );
      renderTimeline();
    });

    return () => {
      unsubProjects?.();
      unsubFlows.forEach((u) => u());
      timelineInstance.current?.destroy();
    };
  }, []);

  return (
    <main>
      <div ref={timelineRef} style={{ height: 600 }} />
    </main>
  );
}