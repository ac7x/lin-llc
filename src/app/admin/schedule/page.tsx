'use client'

import '@/styles/react-calendar-timeline.scss'
import { addDays, endOfDay, parseISO, startOfDay, subDays } from 'date-fns'
import { getApp, getApps, initializeApp } from 'firebase/app'
import {
	collection,
	doc,
	getDocs,
	getFirestore,
	updateDoc
} from 'firebase/firestore'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Timeline, { TimelineGroupBase, TimelineItemBase } from 'react-calendar-timeline'
import { DndContext, useDraggable, DragEndEvent } from "@dnd-kit/core"

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

function DraggableUnplannedTask({ task }: { task: AreaTask }) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: task.id,
		data: { task }
	})
	return (
		<div
			ref={setNodeRef}
			{...attributes}
			{...listeners}
			style={{
				opacity: isDragging ? 0.5 : 1,
				cursor: "grab",
				border: "1px solid #ddd",
				padding: 8,
				marginBottom: 4,
				background: "#fff",
				borderRadius: 4,
			}}
			title={`來自專案 ${task.projectId} 區域 ${task.areaId}`}
		>
			<div>{task.name || '（無標題）'}</div>
			<div className="text-xs text-gray-500">
				專案: {task.projectId} / 區域: {task.areaId}
			</div>
		</div>
	)
}

export default function SchedulePage() {
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

	// Timeline items
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

	// 尚未安排時程
	const unplannedTasks = useMemo(
		() => tasks.filter(t => !t.plannedStartTime),
		[tasks]
	)

	// 拖曳到 timeline 時寫入 Firestore，開始時間對齊 0:00:00，結束+1天
	const handleTimelineDrop = async (event: DragEndEvent) => {
		const task = unplannedTasks.find(t => t.id === event.active.id)
		if (!task) return
		const e = event.activatorEvent as DragEvent
		const timelineElement = timelineRef.current?.querySelector('.react-calendar-timeline') as HTMLElement
		if (!timelineElement || !e) return
		const rect = timelineElement.getBoundingClientRect()
		const y = e.clientY - rect.top
		const groupHeight = rect.height / groups.length
		const groupIndex = Math.floor(y / groupHeight)
		const group = groups[groupIndex]
		if (!group) return
		const timelineWidth = rect.width
		const x = e.clientX - rect.left
		const percent = x / timelineWidth
		const timeRange = defaultTimeEnd.getTime() - defaultTimeStart.getTime()
		const dropTime = new Date(defaultTimeStart.getTime() + percent * timeRange)
		const startTime = new Date(dropTime)
		startTime.setHours(0, 0, 0, 0)
		const endTime = addDays(startTime, 1)
		await updateDoc(
			doc(
				firestore,
				"projects",
				task.projectId,
				"areas",
				task.areaId,
				"tasks",
				task.id
			),
			{
				plannedStartTime: startTime.toISOString(),
				plannedEndTime: endTime.toISOString(),
			}
		)
	}

	// 支援 timeline 內部拖曳（可選）
	const handleAreaTaskMove = async (itemId: string, dragTime: number, newGroupOrder: number) => {
		const item = timelineItems.find(i => i.id === itemId)
		if (!item) return
		const newGroup = groups[newGroupOrder]
		if (!newGroup) return
		const newStart = new Date(dragTime)
		newStart.setHours(0, 0, 0, 0)
		const newEnd = addDays(newStart, 1)
		await updateDoc(
			doc(
				firestore,
				"projects",
				newGroup.projectId,
				"areas",
				newGroup.areaId,
				"tasks",
				itemId
			),
			{
				plannedStartTime: newStart.toISOString(),
				plannedEndTime: newEnd.toISOString(),
			}
		)
	}

	const handleAreaTaskResize = async (itemId: string, time: number, edge: 'left' | 'right') => {
		const task = tasks.find(t => t.id === itemId)
		if (!task) return
		let newStart = task.plannedStartTime ? parseISO(task.plannedStartTime) : new Date()
		let newEnd = task.plannedEndTime ? parseISO(task.plannedEndTime) : addDays(newStart, 1)
		if (edge === 'left') newStart = new Date(time)
		if (edge === 'right') newEnd = new Date(time)
		await updateDoc(
			doc(
				firestore,
				"projects",
				task.projectId,
				"areas",
				task.areaId,
				"tasks",
				itemId
			),
			{
				plannedStartTime: newStart.toISOString(),
				plannedEndTime: newEnd.toISOString(),
			}
		)
	}

	return (
		<div>
			<DndContext onDragEnd={handleTimelineDrop}>
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
								year: 1
							}}
							onItemMove={handleAreaTaskMove}
							onItemResize={handleAreaTaskResize}
							groupRenderer={({ group }) => (
								<div>
									{group.title}
								</div>
							)}
							itemRenderer={({ item, getItemProps, getResizeProps }) => {
								const { left: leftResizeProps, right: rightResizeProps } = getResizeProps()
								return (
									<div
										{...getItemProps({})}
									>
										<div {...leftResizeProps} />
										<span>{item.title}</span>
										<div {...rightResizeProps} />
									</div>
								)
							}}
						/>
					</div>
					<div>
						<h2>尚未安排時程</h2>
						{unplannedTasks.length === 0 ? (
							<div>
								<span>（無未排程工作）</span>
							</div>
						) : (
							<div
								tabIndex={0}
								aria-label="unplanned-jobs"
							>
								{unplannedTasks.map(t => (
									<DraggableUnplannedTask key={t.id} task={t} />
								))}
							</div>
						)}
					</div>
				</div>
			</DndContext>
		</div>
	)
}