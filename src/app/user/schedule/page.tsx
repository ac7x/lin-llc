'use client';

import '@/styles/react-calendar-timeline.scss';
import { addDays, endOfDay, parseISO, startOfDay, subDays } from 'date-fns';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Timeline, { TimelineGroupBase, TimelineItemBase } from 'react-calendar-timeline';

const firebaseConfig = {
  apiKey: 'AIzaSyCUDU4n6SvAQBT8qb1R0E_oWvSeJxYu-ro',
  authDomain: 'lin-llc.firebaseapp.com',
  projectId: 'lin-llc',
  storageBucket: 'lin-llc.firbasestorage.app',
  messagingSenderId: '394023041902',
  appId: '1:394023041902:web:f9874be5d0d192557b1f7f',
  measurementId: 'G-62JEHK00G8',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const firestore = getFirestore(app);

type AreaGroup = {
  id: string;
  title: string;
  projectId: string;
  areaId: string;
};
type AreaTask = {
  id: string;
  name: string;
  status?: string;
  order?: number;
  plannedStartTime?: string;
  plannedEndTime?: string;
  areaId: string;
  projectId: string;
};

export default function SchedulePage() {
  const [groups, setGroups] = useState<AreaGroup[]>([]);
  const [tasks, setTasks] = useState<AreaTask[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);

  // 載入所有專案的所有區域與任務
  useEffect(() => {
    async function fetchAll() {
      const projectsSnap = await getDocs(collection(firestore, 'projects'));
      const areaGroups: AreaGroup[] = [];
      const areaTasks: AreaTask[] = [];
      for (const projectDoc of projectsSnap.docs) {
        const projectId = projectDoc.id;
        const projectName = projectDoc.data().name || projectId;
        const areasSnap = await getDocs(collection(firestore, 'projects', projectId, 'areas'));
        for (const areaDoc of areasSnap.docs) {
          const areaId = areaDoc.id;
          const areaName = areaDoc.data().name || areaId;
          areaGroups.push({
            id: `${projectId}__${areaId}`,
            title: `${projectName} - ${areaName}`,
            projectId,
            areaId,
          });
          const tasksSnap = await getDocs(collection(firestore, 'projects', projectId, 'areas', areaId, 'tasks'));
          for (const taskDoc of tasksSnap.docs) {
            const data = taskDoc.data();
            areaTasks.push({
              id: taskDoc.id,
              name: data.name || '',
              status: data.status,
              order: data.order,
              plannedStartTime: data.plannedStartTime,
              plannedEndTime: data.plannedEndTime,
              areaId,
              projectId,
            });
          }
        }
      }
      setGroups(areaGroups);
      setTasks(areaTasks);
    }
    fetchAll();
  }, []);

  const now = new Date();
  const defaultTimeStart = subDays(startOfDay(now), 2);
  const defaultTimeEnd = addDays(endOfDay(now), 5);

  // Timeline groups
  const timelineGroups: TimelineGroupBase[] = groups;

  // Timeline items（只顯示已排程）
  const timelineItems: TimelineItemBase<Date>[] = useMemo(
    () =>
      tasks
        .filter(t => t.plannedStartTime)
        .map(t => {
          const start = parseISO(t.plannedStartTime!);
          const end = t.plannedEndTime ? parseISO(t.plannedEndTime) : addDays(start, 1);
          return {
            id: t.id,
            group: `${t.projectId}__${t.areaId}`,
            title: t.name,
            start_time: start,
            end_time: end,
          };
        }),
    [tasks]
  );

  // 只顯示日期數字（如 20、21）
  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll('.rct-dateHeader-primary').forEach(el => {
        const match = el.textContent?.match(/\d+/);
        if (match) el.textContent = match[0];
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [timelineItems, timelineGroups]);

  return (
    <div>
      <div
        ref={timelineRef}
        style={{ minHeight: 400 }}
      >
        <Timeline
          groups={timelineGroups}
          items={timelineItems}
          defaultTimeStart={defaultTimeStart.getTime()}
          defaultTimeEnd={defaultTimeEnd.getTime()}
          canMove={false}
          canResize={false}
          canChangeGroup={false}
          stackItems
          minZoom={7 * 24 * 60 * 60 * 1000}
          maxZoom={30 * 24 * 60 * 60 * 1000}
          lineHeight={40}
          sidebarWidth={75}
          timeSteps={{
            second: 1,
            minute: 1,
            hour: 1,
            day: 1,
            month: 1,
            year: 1,
          }}
          groupRenderer={({ group }) => <div>{group.title}</div>}
          itemRenderer={({ item, getItemProps }) => (
            <div {...getItemProps({})}>
              <span>{item.title}</span>
            </div>
          )}
        />
      </div>
    </div>
  );
}
