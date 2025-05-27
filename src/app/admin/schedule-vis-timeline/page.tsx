"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { addDays, endOfDay, parseISO, startOfDay, subDays } from "date-fns"
import { getApp, getApps, initializeApp } from "firebase/app"
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  updateDoc
} from "firebase/firestore"
import "vis-timeline/styles/vis-timeline-graph2d.min.css"
import { Timeline as VisTimeline } from "vis-timeline/standalone"

const firebaseConfig = {
  apiKey: 'AIzaSyCUDU4n6SvAQBT8qb1R0E_oWvSeJxYu-ro',
  authDomain: 'lin-llc.firebaseapp.com',
  projectId: 'lin-llc',
  storageBucket: 'lin-llc.firbasestorage.app',
  messagingSenderId: '394023041902',
  appId: '1:394023041902:web:f9874be5d0d192557b1f7f',
  measurementId: 'G-62JEHK00G8'
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
const firestore = getFirestore(app)

type AreaGroup = {
  id: string
  title: string
  projectId: string
  areaId: string
}
type AreaTask = {
  id: string
  name: string
  status?: string
  order?: number
  plannedStartTime?: string
  plannedEndTime?: string
  areaId: string
  projectId: string
}

export default function ScheduleVisTimelinePage() {
  const [groups, setGroups] = useState<AreaGroup[]>([])
  const [tasks, setTasks] = useState<AreaTask[]>([])
  const timelineRef = useRef<HTMLDivElement>(null)
  const visTimeline = useRef<VisTimeline | null>(null)

  useEffect(() => {
    async function fetchAll() {
      const projectsSnap = await getDocs(collection(firestore, 'projects'))
      const areaGroups: AreaGroup[] = []
      const areaTasks: AreaTask[] = []
      for (const projectDoc of projectsSnap.docs) {
        const projectId = projectDoc.id
        const projectName = projectDoc.data().name || projectId
        const areasSnap = await getDocs(collection(firestore, 'projects', projectId, 'areas'))
        for (const areaDoc of areasSnap.docs) {
          const areaId = areaDoc.id
          const areaName = areaDoc.data().name || areaId
          areaGroups.push({
            id: `${projectId}__${areaId}`,
            title: `${projectName} - ${areaName}`,
            projectId,
            areaId,
          })
          const tasksSnap = await getDocs(collection(firestore, 'projects', projectId, 'areas', areaId, 'tasks'))
          for (const taskDoc of tasksSnap.docs) {
            const data = taskDoc.data()
            areaTasks.push({
              id: taskDoc.id,
              name: data.name || '',
              status: data.status,
              order: data.order,
              plannedStartTime: data.plannedStartTime,
              plannedEndTime: data.plannedEndTime,
              areaId,
              projectId,
            })
          }
        }
      }
      setGroups(areaGroups)
      setTasks(areaTasks)
    }
    fetchAll()
  }, [])

  const now = new Date()
  const defaultTimeStart = subDays(startOfDay(now), 7)
  const defaultTimeEnd = addDays(endOfDay(now), 14)

  // vis-timeline groups
  const visGroups = useMemo(() => groups.map(g => ({ id: g.id, content: g.title })), [groups])
  // vis-timeline items
  const visItems = useMemo(() =>
    tasks.filter(t => t.plannedStartTime).map(t => ({
      id: t.id,
      group: `${t.projectId}__${t.areaId}`,
      content: t.name,
      start: t.plannedStartTime ? new Date(t.plannedStartTime) : new Date(),
      end: t.plannedEndTime ? new Date(t.plannedEndTime) : addDays(parseISO(t.plannedStartTime!), 1),
    })), [tasks]
  )

  useEffect(() => {
    if (!timelineRef.current) return
    if (visTimeline.current) {
      visTimeline.current.setGroups(visGroups)
      visTimeline.current.setItems(visItems)
      return
    }
    // vis-timeline 沒有正確型別，需忽略型別檢查
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    visTimeline.current = new VisTimeline(timelineRef.current, visItems, visGroups, {
      stack: true,
      start: defaultTimeStart,
      end: defaultTimeEnd,
      min: subDays(defaultTimeStart, 7),
      max: addDays(defaultTimeEnd, 30),
      editable: {
        updateTime: true,
        updateGroup: true,
        remove: false,
        add: false,
      },
      margin: { item: 10, axis: 5 },
      orientation: 'top',
      groupOrder: 'content',
      zoomMin: 7 * 24 * 60 * 60 * 1000,
      zoomMax: 30 * 24 * 60 * 60 * 1000,
      height: 400,
    })
    visTimeline.current.on('move', async (event: { item: string, start: Date, end: Date, group: string }) => {
      const { item, start, end } = event
      const task = tasks.find(t => t.id === item)
      if (!task) return
      await updateDoc(
        doc(
          firestore,
          'projects',
          task.projectId,
          'areas',
          task.areaId,
          'tasks',
          task.id
        ),
        {
          plannedStartTime: start.toISOString(),
          plannedEndTime: end.toISOString(),
        }
      )
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, plannedStartTime: start.toISOString(), plannedEndTime: end.toISOString() } : t))
    })
    visTimeline.current.on('groupChanged', async (event: { item: string, group: string }) => {
      const { item, group: newGroupId } = event
      const task = tasks.find(t => t.id === item)
      const newGroup = groups.find(g => g.id === newGroupId)
      if (!task || !newGroup) return
      await updateDoc(
        doc(
          firestore,
          newGroup.projectId,
          'areas',
          newGroup.areaId,
          'tasks',
          task.id
        ),
        {
          plannedStartTime: task.plannedStartTime,
          plannedEndTime: task.plannedEndTime,
        }
      )
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, areaId: newGroup.areaId, projectId: newGroup.projectId } : t))
    })
    // eslint-disable-next-line
  }, [timelineRef, visGroups, visItems])

  return (
    <div>
      <div ref={timelineRef} style={{ minHeight: 400 }} />
      <div className="mt-6">
        <h2>尚未安排時程</h2>
        {tasks.filter(t => !t.plannedStartTime).length === 0 ? (
          <div>
            <span>（無未排程工作）</span>
          </div>
        ) : (
          <div tabIndex={0} aria-label="unplanned-jobs">
            {tasks.filter(t => !t.plannedStartTime).map(t => (
              <div key={t.id} style={{ border: '1px solid #ddd', padding: 4, marginBottom: 2, background: '#fff', borderRadius: 3, fontSize: 14 }}>
                <div style={{ fontWeight: 500 }}>{t.name || '（無標題）'}</div>
                <div className="text-xs text-gray-500" style={{ fontSize: 12 }}>
                  專案: {t.projectId} / 區域: {t.areaId}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
