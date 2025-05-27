'use client'

import '@/styles/react-calendar-timeline.scss'
import { addDays, endOfDay, parseISO, startOfDay, subDays, differenceInMilliseconds, isValid } from 'date-fns'
import { db as firestore } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Timeline, { TimelineGroupBase, TimelineItemBase } from 'react-calendar-timeline'
import { AdminBottomNav } from '@/modules/shared/interfaces/navigation/admin-bottom-nav'

interface AreaGroup {
  id: string
  title: string
  projectId: string
  areaId: string
}
interface AreaTask {
  id: string
  name: string
  status?: string
  order?: number
  plannedStartTime?: string
  plannedEndTime?: string
  areaId: string
  projectId: string
}

const AdminSchedulePage: React.FC = () => {
  const [groups, setGroups] = useState<AreaGroup[]>([])
  const [tasks, setTasks] = useState<AreaTask[]>([])
  const timelineRef = useRef<HTMLDivElement>(null)

  // 載入所有專案的所有區域與任務
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

  // Timeline groups
  const timelineGroups: TimelineGroupBase[] = groups

  // Timeline items（只顯示已排程）
  const timelineItems: TimelineItemBase<Date>[] = useMemo(
    () =>
      tasks
        .filter(t => t.plannedStartTime)
        .map(t => {
          const start = parseISO(t.plannedStartTime!)
          const end = t.plannedEndTime ? parseISO(t.plannedEndTime) : addDays(start, 1)
          return {
            id: t.id,
            group: `${t.projectId}__${t.areaId}`,
            title: t.name,
            start_time: start,
            end_time: end,
          }
        }),
    [tasks]
  )

  // 拖曳移動任務
  const handleItemMove = async (itemId: string, dragTime: number, newGroupOrder: number) => {
    const item = timelineItems.find(i => i.id === itemId)
    if (!item) return
    const oldTask = tasks.find(t => t.id === itemId)
    if (!oldTask) return
    const newGroup = timelineGroups[newGroupOrder]
    if (!newGroup) return
    const [newProjectId, newAreaId] = String(newGroup.id).split('__')
    const newStart = new Date(dragTime)
    const duration = differenceInMilliseconds(item.end_time as Date, item.start_time as Date)
    const newEnd = new Date(newStart.getTime() + duration)
    // 刪除舊位置，新增到新位置（如果分組有變）
    if (oldTask.projectId !== newProjectId || oldTask.areaId !== newAreaId) {
      // 先刪除舊 task，再新增到新區域（可依需求調整為複製+刪除）
      // 這裡僅更新時間與分組
      await updateDoc(
        doc(
          firestore,
          'projects',
          newProjectId,
          'areas',
          newAreaId,
          'tasks',
          itemId
        ),
        {
          plannedStartTime: newStart.toISOString(),
          plannedEndTime: newEnd.toISOString(),
          name: oldTask.name,
          status: oldTask.status,
          order: oldTask.order,
        }
      )
      // 若舊區域有該 task，建議刪除舊 task 文件（可依需求保留）
      // await deleteDoc(doc(firestore, 'projects', oldTask.projectId, 'areas', oldTask.areaId, 'tasks', itemId))
    } else {
      // 只更新時間
      await updateDoc(
        doc(
          firestore,
          'projects',
          oldTask.projectId,
          'areas',
          oldTask.areaId,
          'tasks',
          itemId
        ),
        {
          plannedStartTime: newStart.toISOString(),
          plannedEndTime: newEnd.toISOString(),
        }
      )
    }
    // 重新載入
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

  // 拖曳調整長度
  const handleItemResize = async (itemId: string, time: number, edge: 'left' | 'right') => {
    const oldTask = tasks.find(t => t.id === itemId)
    if (!oldTask) return
    let newStart = oldTask.plannedStartTime ? parseISO(oldTask.plannedStartTime) : new Date()
    let newEnd = oldTask.plannedEndTime ? parseISO(oldTask.plannedEndTime) : undefined
    if (edge === 'left') newStart = new Date(time)
    if (edge === 'right') newEnd = new Date(time)
    await updateDoc(
      doc(
        firestore,
        'projects',
        oldTask.projectId,
        'areas',
        oldTask.areaId,
        'tasks',
        itemId
      ),
      {
        plannedStartTime: newStart.toISOString(),
        plannedEndTime: newEnd && isValid(newEnd) ? newEnd.toISOString() : '',
      }
    )
    // 重新載入
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

  // 只顯示日期數字（如 20、21）
  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll('.rct-dateHeader-primary').forEach(el => {
        const match = el.textContent?.match(/\d+/)
        if (match) el.textContent = match[0]
      })
    }, 100)
    return () => clearTimeout(timer)
  }, [timelineItems, timelineGroups])

  return (
    <div>
      <div ref={timelineRef} style={{ minHeight: 400 }}>
        <Timeline
          groups={timelineGroups}
          items={timelineItems}
          defaultTimeStart={defaultTimeStart.getTime()}
          defaultTimeEnd={defaultTimeEnd.getTime()}
          canMove
          canResize="both"
          canChangeGroup
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
          onItemMove={handleItemMove}
          onItemResize={handleItemResize}
          groupRenderer={({ group }) => <div>{group.title}</div>}
          itemRenderer={({ item, getItemProps }) => (
            <div {...getItemProps({})}>
              <span>{item.title}</span>
            </div>
          )}
        />
      </div>
      <AdminBottomNav />
    </div>
  )
}

export default AdminSchedulePage