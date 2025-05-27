'use client'

import '@/styles/react-calendar-timeline.scss'
import { addDays, differenceInMilliseconds, endOfDay, isValid, parseISO, startOfDay, subDays } from 'date-fns'
import { getApp, getApps, initializeApp } from 'firebase/app'
import {
	collection,
	doc,
	DocumentData,
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

const getWorkloadContent = (wl: Pick<WorkLoadEntity, 'title' | 'executor'>): string =>
	`${wl.title || '（無標題）'} | ${Array.isArray(wl.executor) ? wl.executor.join(', ') : '（無執行者）'}`

const WorkScheduleManagementPage: React.FC = () => {
	const [epics, setEpics] = useState<WorkEpicEntity[]>([])
	const [unplanned, setUnplanned] = useState<LooseWorkLoad[]>([])
	const [epicSnapshot] = useCollection(collection(firestore, 'workEpic'))
	const timelineRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!epicSnapshot) { return }
		const { epics, unplanned } = parseEpicSnapshot(epicSnapshot.docs)
		setEpics(epics)
		setUnplanned(unplanned)
	}, [epicSnapshot])

	const groupCount = 5
	const groups: TimelineGroupBase[] = useMemo(() => {
		const filledEpics: WorkEpicEntity[] = [...epics]
		while (filledEpics.length < groupCount) {
			filledEpics.push({
				epicId: `empty-${filledEpics.length}`,
				title: ''
			})
		}
		return filledEpics.map(e => ({
			id: e.epicId,
			title: e.title
		}))
	}, [epics])

	const items: TimelineItemBase<Date>[] = useMemo(() =>
		epics.flatMap(e =>
			(e.workLoads || [])
				.filter(l => l.plannedStartTime)
				.map(l => {
					const start = parseISO(l.plannedStartTime)
					const end = l.plannedEndTime ? parseISO(l.plannedEndTime) : addDays(start, 1)
					return {
						id: l.loadId,
						group: e.epicId,
						title: getWorkloadContent(l),
						start_time: start,
						end_time: end
					}
				})
		), [epics])

	const handleItemMove = async (itemId: string, dragTime: number, newGroupOrder: number): Promise<void> => {
		const item = items.find(i => i.id === itemId)
		if (!item) { return }
		const oldEpic = epics.find(e => (e.workLoads || []).some(wl => wl.loadId === itemId))
		if (!oldEpic) { return }
		const wlIdx = (oldEpic.workLoads || []).findIndex(wl => wl.loadId === itemId)
		if (wlIdx === -1) { return }
		const newGroupId = groups[newGroupOrder].id as string
		const newEpic = epics.find(e => e.epicId === newGroupId)
		if (!newEpic) { return }
		const newStart = new Date(dragTime)
		const duration = differenceInMilliseconds(item.end_time as Date, item.start_time as Date)
		const newEnd = new Date(newStart.getTime() + duration)
		if (oldEpic.epicId !== newEpic.epicId) {
			const updatedOldWorkLoads = (oldEpic.workLoads || []).filter(wl => wl.loadId !== itemId)
			await updateDoc(doc(firestore, 'workEpic', oldEpic.epicId), { workLoads: updatedOldWorkLoads })
			const oldWorkload = (oldEpic.workLoads || [])[wlIdx]
			const newWorkLoad: WorkLoadEntity = {
				...oldWorkload,
				plannedStartTime: newStart.toISOString(),
				plannedEndTime: newEnd.toISOString()
			}
			const updatedNewWorkLoads = [...(newEpic.workLoads || []), newWorkLoad]
			await updateDoc(doc(firestore, 'workEpic', newEpic.epicId), { workLoads: updatedNewWorkLoads })
		} else {
			const newWorkLoads = [...(oldEpic.workLoads || [])]
			newWorkLoads[wlIdx] = {
				...newWorkLoads[wlIdx],
				plannedStartTime: newStart.toISOString(),
				plannedEndTime: newEnd.toISOString()
			}
			await updateDoc(doc(firestore, 'workEpic', oldEpic.epicId), { workLoads: newWorkLoads })
		}
	}

	const handleItemResize = async (itemId: string, time: number, edge: 'left' | 'right'): Promise<void> => {
		const epic = epics.find(e => (e.workLoads || []).some(wl => wl.loadId === itemId))
		if (!epic) { return }
		const wlIdx = (epic.workLoads || []).findIndex(wl => wl.loadId === itemId)
		if (wlIdx === -1) { return }
		const wl = (epic.workLoads || [])[wlIdx]
		let newStart = parseISO(wl.plannedStartTime)
		let newEnd = wl.plannedEndTime ? parseISO(wl.plannedEndTime) : undefined
		if (edge === 'left') { newStart = new Date(time) }
		if (edge === 'right') { newEnd = new Date(time) }
		const newWorkLoads = [...(epic.workLoads || [])]
		newWorkLoads[wlIdx] = {
			...wl,
			plannedStartTime: newStart.toISOString(),
			plannedEndTime: newEnd && isValid(newEnd) ? newEnd.toISOString() : ''
		}
		await updateDoc(doc(firestore, 'workEpic', epic.epicId), { workLoads: newWorkLoads })
	}

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
							sidebarWidth={75} // 原本 150，改為一半
							timeSteps={{
								second: 1,
								minute: 1,
								hour: 1,
								day: 1,
								month: 1,
								year: 1
							}}
							onItemMove={handleItemMove}
							onItemResize={(itemId, time, edge) => handleItemResize(itemId as string, time, edge)}
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
						<h2>
							未排程工作
						</h2>
						{unplanned.length === 0 ? (
							<div>
								<span>
									（無未排程工作）
								</span>
							</div>
						) : (
							<div
								tabIndex={0}
								aria-label="unplanned-jobs"
							>
								{unplanned.map(wl => (
									<div
										key={wl.loadId}
										draggable={true}
										onDragStart={e => {
											e.dataTransfer.setData('application/json', JSON.stringify(wl))
										}}
										title={`來自 ${wl.epicTitle}`}
									>
										<div>
											{wl.title || '（無標題）'}
										</div>
										<div>
											{Array.isArray(wl.executor) && wl.executor.length > 0 ? wl.executor.join(', ') : '（無執行者）'}
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
