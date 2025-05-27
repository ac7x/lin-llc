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
import Timeline, { TimelineGroupBase, TimelineItemBase, TimelineMarkers, TodayMarker } from 'react-calendar-timeline'

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
	quantity?: number // 新增數量欄位
}

export default function SchedulePage() {
	const [groups, setGroups] = useState<AreaGroup[]>([])
	const [tasks, setTasks] = useState<AreaTask[]>([])
	const timelineRef = useRef<HTMLDivElement>(null)
	const [showDateDialog, setShowDateDialog] = useState(false)
	const [selectedTask, setSelectedTask] = useState<AreaTask | null>(null)
	const [dateRange, setDateRange] = useState<{ start: string, end: string }>({ start: '', end: '' })
	const [quantityTip, setQuantityTip] = useState<string | null>(null)

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
							quantity: data.quantity // 保留數量
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

	// 點擊未排程任務後顯示日期選擇彈窗
	const handleUnplannedTaskClick = (task: AreaTask) => {
		if (typeof task.quantity === "number" && task.quantity > 1) {
			setQuantityTip(`此任務數量為 ${task.quantity}`)
		} else {
			setQuantityTip(null)
		}
		setSelectedTask(task)
		setDateRange({ start: '', end: '' })
		setShowDateDialog(true)
	}

	// 確認選擇日期後寫入
	const handleDateDialogConfirm = async () => {
		if (!selectedTask) return
		const { start, end } = dateRange
		const startDate = new Date(start)
		const endDate = new Date(end)
		if (!start || !end || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
			alert('請選擇正確的日期')
			return
		}
		startDate.setHours(0, 0, 0, 0)
		endDate.setHours(0, 0, 0, 0)
		await updateDoc(
			doc(
				firestore,
				"projects",
				selectedTask.projectId,
				"areas",
				selectedTask.areaId,
				"tasks",
				selectedTask.id
			),
			{
				plannedStartTime: startDate.toISOString(),
				plannedEndTime: endDate.toISOString(),
			}
		)
		// 重新載入資料
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
						quantity: data.quantity // 保留數量
					})
				}
			}
		}
		setGroups(areaGroups)
		setTasks(areaTasks)
		setShowDateDialog(false)
		setSelectedTask(null)
		setQuantityTip(null)
	}

	return (
		<div>
			{/* 日期選擇彈窗 */}
			{showDateDialog && (
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						width: '100vw',
						height: '100vh',
						background: 'rgba(0,0,0,0.2)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 1000
					}}
				>
					<div style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 300 }}>
						<div style={{ marginBottom: 8 }}>
							{quantityTip && <div style={{ color: '#b45309', marginBottom: 8 }}>{quantityTip}</div>}
							<div>請選擇開始與結束日期：</div>
							<div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
								<input
									type="date"
									value={dateRange.start}
									onChange={e => setDateRange(r => ({ ...r, start: e.target.value }))}
								/>
								<span>至</span>
								<input
									type="date"
									value={dateRange.end}
									onChange={e => setDateRange(r => ({ ...r, end: e.target.value }))}
								/>
							</div>
						</div>
						<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
							<button onClick={() => { setShowDateDialog(false); setSelectedTask(null); setQuantityTip(null); }}>取消</button>
							<button onClick={handleDateDialogConfirm} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 4 }}>確認</button>
						</div>
					</div>
				</div>
			)}
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
					>
						{/* 添加今天的紅線 */}
						<TimelineMarkers>
							<TodayMarker />
						</TimelineMarkers>
					</Timeline>
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
							{/* 點擊未排程任務可輸入日期 */}
							{unplannedTasks.map(t => (
								<div
									key={t.id}
									style={{
										border: "1px solid #ddd",
										padding: 8,
										marginBottom: 4,
										background: "#fff",
										borderRadius: 4,
										cursor: "pointer"
									}}
									title={`來自專案 ${t.projectId} 區域 ${t.areaId}`}
									onClick={() => handleUnplannedTaskClick(t)}
								>
									<div>{t.name || '（無標題）'}</div>
									<div className="text-xs text-gray-500">
										專案: {t.projectId} / 區域: {t.areaId}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}