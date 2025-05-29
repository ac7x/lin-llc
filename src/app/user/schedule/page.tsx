"use client";

import React, { useEffect, useRef } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, onSnapshot } from "firebase/firestore";
import { Timeline, DataSet } from "vis-timeline/standalone";

export default function UserSchedulePage() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstance = useRef<Timeline | null>(null);

  useEffect(() => {
    if (!timelineRef.current) return;

    let groups: { id: string; content: string }[] = [];
    let items: {
      id: string;
      group: string;
      content: string;
      start: Date;
      end: Date;
    }[] = [];
    let unsubFlows: (() => void)[] = [];

    const renderTimeline = () => {
      timelineInstance.current?.destroy();
      timelineInstance.current = new Timeline(
        timelineRef.current!,
        new DataSet(items),
        new DataSet(groups),
        { editable: false }
      );
    };

    const unsubProjects = onSnapshot(collection(db, "projects"), (projectSnap) => {
      groups = projectSnap.docs.map(doc => ({
        id: doc.id,
        content: doc.data().projectName ?? doc.id,
      }));

      items = [];
      unsubFlows.forEach(u => u());
      unsubFlows = projectSnap.docs.map(projectDoc =>
        onSnapshot(collection(db, "projects", projectDoc.id, "flows"), (flowSnap) => {
          items = items.filter(i => i.group !== projectDoc.id);
          flowSnap.docs.forEach(doc => {
            const d = doc.data() as {
              name?: string;
              start?: { toDate?: () => Date } | number;
              end?: { toDate?: () => Date } | number;
            };
            items.push({
              id: doc.id,
              group: projectDoc.id,
              content: d.name ?? "流程",
              start: d.start && typeof d.start === "object" && "toDate" in d.start
                ? d.start.toDate!()
                : new Date((d.start as number) ?? Date.now()),
              end: d.end && typeof d.end === "object" && "toDate" in d.end
                ? d.end.toDate!()
                : new Date((d.end as number) ?? Date.now() + 86400000),
            });
          });
          renderTimeline();
        })
      );
      renderTimeline();
    });

    return () => {
      unsubProjects();
      unsubFlows.forEach(u => u());
      timelineInstance.current?.destroy();
    };
  }, []);

  return <main><div ref={timelineRef} style={{ height: 600 }} /></main>;
}