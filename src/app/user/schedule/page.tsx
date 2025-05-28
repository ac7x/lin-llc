"use client";

import React, { useEffect, useRef } from 'react';
import { Timeline } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection } from 'firebase/firestore';
import { db } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client'; // 確保路徑正確

interface Flow {
  id: string;
  projectId: string;
  name: string;
  startDate: string; // 假設日期格式為 'YYYY-MM-DD'
  endDate: string;   // 假設日期格式為 'YYYY-MM-DD'
}

interface Project {
  id: string;
  name: string;
}

const SchedulePage = () => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [projectsSnapshot, projectsLoading, projectsError] = useCollection(collection(db, 'projects'));
  const [flowsSnapshot, flowsLoading, flowsError] = useCollection(collection(db, 'flows'));

  useEffect(() => {
    if (timelineRef.current && projectsSnapshot && flowsSnapshot) {
      const projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      const flows = flowsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flow));

      const groups = projects.map(project => ({
        id: project.id,
        content: project.name,
      }));

      const items = flows.map(flow => ({
        id: flow.id,
        group: flow.projectId,
        content: flow.name,
        start: flow.startDate,
        end: flow.endDate,
      }));

      const options = {}; // 在此處加入 vis-timeline 選項

      const timeline = new Timeline(timelineRef.current, items, groups, options);

      return () => {
        timeline.destroy();
      };
    }
  }, [projectsSnapshot, flowsSnapshot]);

  if (projectsLoading || flowsLoading) {
    return <p>Loading...</p>;
  }

  if (projectsError || flowsError) {
    return <p>Error loading data: {projectsError?.message || flowsError?.message}</p>;
  }

  return <div ref={timelineRef} style={{ height: '500px' }} />;
};

export default SchedulePage;
