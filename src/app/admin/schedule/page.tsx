'use client'

import '@/styles/react-calendar-timeline.scss'
import { addDays, differenceInMilliseconds, endOfDay, isValid, parseISO, startOfDay, subDays } from 'date-fns'
import { getApp, getApps, initializeApp } from 'firebase/app'
import {
	collection,
	doc,
	DocumentData,
	getDocs,
	getFirestore,
	QueryDocumentSnapshot,
	updateDoc
} from 'firebase/firestore'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Timeline, { TimelineGroupBase, TimelineItemBase } from 'react-calendar-timeline'
import { useCollection } from 'react-firebase-hooks/firestore'

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

interface WorkLoadEntity {
	loadId: string
	title: string
	executor: string[]
	plannedStartTime: string
	plannedEndTime: string
}

interface WorkEpicEntity {
	epicId: string
	title: string
	workLoads?: WorkLoadEntity[]
}

type LooseWorkLoad = WorkLoadEntity & { epicId: string; epicTitle: string }

/** 解析 Epic Snapshot，取得 epics 與未排班工作 */
const parseEpicSnapshot = (
	docs: QueryDocumentSnapshot<DocumentData, DocumentData>[]
): { epics: WorkEpicEntity[]; unplanned: LooseWorkLoad[] } => {
	const epics: WorkEpicEntity[] = docs.map(
		doc => ({ ...doc.data(), epicId: doc.id } as WorkEpicEntity)
	)
	const unplanned: LooseWorkLoad[] = epics.flatMap(e =>
		(e.workLoads || [])
			.filter(l => !l.plannedStartTime)
			.map(l => ({ ...l, epicId: e.epicId, epicTitle: e.title }))
	)
	return { epics, unplanned }
}

const WorkScheduleManagementPage: React.FC = () => {
	const [epics, setEpics] = useState<WorkEpicEntity[]>([])
	const [areaGroups, setAreaGroups] = useState<
		{ id: string; title: string; projectId: string; areaId: string }[]
	>([]);
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
	const [areaTasks, setAreaTasks] = useState<AreaTask[]>([]);
	const [epicSnapshot] = useCollection(collection(firestore, 'workEpic'))
	const timelineRef = useRef<HTMLDivElement>(null)

	// 載入所有專案的所有區域作為 groups
	useEffect(() => {
		async function fetchAreaGroupsAndTasks() {
			const projectsSnap = await getDocs(collection(firestore, 'projects'));
			const groups: { id: string; title: string; projectId: string; areaId: string }[] = [];
			const tasks: AreaTask[] = [];
			for (const projectDoc of projectsSnap.docs) {
				const projectName = projectDoc.data().name || projectDoc.id;
				const areasSnap = await getDocs(collection(firestore, 'projects', projectDoc.id, 'areas'));
				for (const areaDoc of areasSnap.docs) {
					const areaName = areaDoc.data().name || areaDoc.id;
					groups.push({
						id: areaDoc.id,
						title: `${projectName} - ${areaName}`,
						projectId: projectDoc.id,
						areaId: areaDoc.id,
					});
					// 讀取該區域下的 tasks
					const tasksSnap = await getDocs(collection(firestore, 'projects', projectDoc.id, 'areas', areaDoc.id, 'tasks'));
					for (const taskDoc of tasksSnap.docs) {
						const taskData = taskDoc.data();
						tasks.push({
							id: taskDoc.id,
							name: taskData.name || '',
							status: taskData.status,
							order: taskData.order,
							plannedStartTime: taskData.plannedStartTime,
							plannedEndTime: taskData.plannedEndTime,
							areaId: areaDoc.id,
							projectId: projectDoc.id,
						});
					}
				}
			}
			setAreaGroups(groups);
			setAreaTasks(tasks);
		}
		fetchAreaGroupsAndTasks();
	}, []); // 只在 mount 時執行即可

	useEffect(() => {
		if (!epicSnapshot) { return }
		const { epics } = parseEpicSnapshot(epicSnapshot.docs)
		setEpics(epics)
	}, [epicSnapshot])

	// groups 來源改為 areaGroups
	const groups: TimelineGroupBase[] = areaGroups;

	// items 來源改為 areaTasks
	const items: TimelineItemBase<Date>[] = useMemo(() =>
		areaTasks
			.filter(t => t.plannedStartTime)
			.map(t => {
				const start = parseISO(t.plannedStartTime!);
				const end = t.plannedEndTime ? parseISO(t.plannedEndTime) : addDays(start, 1);
				return {
					id: t.id,
					group: t.areaId,
					title: t.name,
					start_time: start,
					end_time: end,
				};
			}),
		[areaTasks]
	);

	// 未排程工作：沒有 plannedStartTime 的 tasks
	const unplannedTasks = useMemo(
		() => areaTasks.filter(t => !t.plannedStartTime),
		[areaTasks]
	);

	// 刪除未使用的 handleItemMove 和 handleItemResize
	// const handleItemMove = async (itemId: string, dragTime: number, newGroupOrder: number): Promise<void> => { ... }
	// const handleItemResize = async (itemId: string, time: number, edge: 'left' | 'right'): Promise<void> => { ... }

	const handleItemRemove = async (itemId: string): Promise<void> => {
		const epic = epics.find(e => (e.workLoads || []).some(wl => wl.loadId === itemId))
		if (!epic) { return }
		const wlIdx = (epic.workLoads || []).findIndex(wl => wl.loadId === itemId)
		if (wlIdx === -1) { return }
		const newWorkLoads = [...(epic.workLoads || [])]
		const updateWL = { ...newWorkLoads[wlIdx], plannedStartTime: '', plannedEndTime: '' }
		newWorkLoads[wlIdx] = updateWL
		await updateDoc(doc(firestore, 'workEpic', epic.epicId), { workLoads: newWorkLoads })
	}

	const handleAssignToTimeline = async (
		wlDragged: LooseWorkLoad, // Item from the unplanned list
		targetGroupId: string,    // epicId of the row it was dropped on
		startTime: Date,
		endTime: Date
	) => {
		const originalEpicId = wlDragged.epicId
		const workLoadId = wlDragged.loadId

		const originalEpicState = epics.find(e => e.epicId === originalEpicId)
		if (!originalEpicState || !originalEpicState.workLoads) {
			console.error('Original epic or its workloads not found in state:', originalEpicId)
			return
		}

		const workloadWithNewTimes: WorkLoadEntity = {
			loadId: workLoadId,
			title: wlDragged.title,
			executor: wlDragged.executor,
			plannedStartTime: startTime.toISOString(),
			plannedEndTime: endTime.toISOString()
		}

		if (originalEpicId === targetGroupId) {
			const newWorkLoads = originalEpicState.workLoads.map(wl =>
				wl.loadId === workLoadId ? workloadWithNewTimes : wl
			)
			await updateDoc(doc(firestore, 'workEpic', originalEpicId), { workLoads: newWorkLoads })
		} else {
			const targetEpicState = epics.find(e => e.epicId === targetGroupId)
			if (!targetEpicState) {
				console.warn(`Target epic ${targetGroupId} not found. Item will be scheduled in its original epic.`)
				const newWorkLoads = originalEpicState.workLoads.map(wl =>
					wl.loadId === workLoadId ? workloadWithNewTimes : wl
				)
				await updateDoc(doc(firestore, 'workEpic', originalEpicId), { workLoads: newWorkLoads })
				return
			}

			const updatedOriginalWorkLoads = originalEpicState.workLoads.filter(
				wl => wl.loadId !== workLoadId
			)

			const newTargetWorkLoads = [...(targetEpicState.workLoads || []), workloadWithNewTimes]

			await updateDoc(doc(firestore, 'workEpic', originalEpicId), { workLoads: updatedOriginalWorkLoads })
			await updateDoc(doc(firestore, 'workEpic', targetGroupId), { workLoads: newTargetWorkLoads })
		}
	}

	const now = new Date()
	const defaultTimeStart = subDays(startOfDay(now), 7)
	const defaultTimeEnd = addDays(endOfDay(now), 14)

	// 新增：拖曳後更新 Firestore 的區域任務
	const handleAreaTaskMove = async (itemId: string, dragTime: number, newGroupOrder: number) => {
		const item = items.find(i => i.id === itemId);
		if (!item) return;
		const newGroup = groups[newGroupOrder];
		if (!newGroup) return;
		const newStart = new Date(dragTime);
		const duration = differenceInMilliseconds(item.end_time as Date, item.start_time as Date);
		const newEnd = new Date(newStart.getTime() + duration);

		// 找到該 task 的 projectId, areaId
		const task = areaTasks.find(t => t.id === itemId);
		if (!task) return;

		await updateDoc(
			doc(
				firestore,
				"projects",
				task.projectId,
				"areas",
				String(newGroup.id), // 這裡強制轉成 string
				"tasks",
				itemId
			),
			{
				plannedStartTime: newStart.toISOString(),
				plannedEndTime: newEnd.toISOString(),
				// 若 group 變動，需移動 task 到新區域（需額外實作，這裡僅更新時間）
			}
		);
	};

	// 新增：調整長度
	const handleAreaTaskResize = async (itemId: string, time: number, edge: 'left' | 'right') => {
		const task = areaTasks.find(t => t.id === itemId);
		if (!task) return;
		let newStart = task.plannedStartTime ? parseISO(task.plannedStartTime) : new Date();
		let newEnd = task.plannedEndTime ? parseISO(task.plannedEndTime) : addDays(newStart, 1);
		if (edge === 'left') newStart = new Date(time);
		if (edge === 'right') newEnd = new Date(time);
		await updateDoc(
			doc(firestore, "projects", task.projectId, "areas", task.areaId, "tasks", itemId),
			{
				plannedStartTime: newStart.toISOString(),
				plannedEndTime: newEnd.toISOString(),
			}
		);
	};

	return (
		<div>
			<div>
				<div
					ref={timelineRef}
					onDragOver={e => {
						e.preventDefault()
					}}
					onDrop={e => {
						e.preventDefault()
						try {
							const jsonData = e.dataTransfer.getData('application/json')
							if (!jsonData) { return }
							const droppedWl = JSON.parse(jsonData) as LooseWorkLoad
							const timelineElement = document.querySelector('.react-calendar-timeline')
							if (!timelineElement) { return }
							const rect = timelineElement.getBoundingClientRect()
							const y = e.clientY - rect.top
							const groupHeight = rect.height / groups.length
							const groupIndex = Math.floor(y / groupHeight)
							const group = groups[groupIndex]
							if (!group) { return }
							const groupId = group.id as string
							const timelineWidth = rect.width
							const x = e.clientX - rect.left
							const percent = x / timelineWidth
							const timeRange = defaultTimeEnd.getTime() - defaultTimeStart.getTime()
							const dropTime = new Date(defaultTimeStart.getTime() + percent * timeRange)
							const startTime = dropTime
							const endTime = addDays(startTime, 1)
							handleAssignToTimeline(droppedWl, groupId, startTime, endTime)
						} catch (error) {
							console.error('Error processing dropped item:', error)
						}
					}}
				>
					<div>
						<Timeline
							groups={groups}
							items={items}
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
							onItemDoubleClick={handleItemRemove}
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
				</div>
				<div>
					<div>
						<h2>未排程工作</h2>
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
									<div
										key={t.id}
										draggable={true}
										onDragStart={e => {
											e.dataTransfer.setData('application/json', JSON.stringify(t))
										}}
										title={`來自專案 ${t.projectId} 區域 ${t.areaId}`}
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
		</div>
	)
}

export default WorkScheduleManagementPage
