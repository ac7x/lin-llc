"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Timeline, DataSet, TimelineItem, TimelineGroup, TimelineOptions, DateType } from "vis-timeline/standalone";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/lib/firebase-client";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { SubWorkpackage, Workpackage } from "@/types/project";
import { Timestamp } from "firebase/firestore";

interface Group extends TimelineGroup {
    id: string;
    content: string;
}

interface TimelineSubWorkpackage extends SubWorkpackage {
    projectId: string;
    projectName: string;
    workpackageId: string;
    workpackageName: string;
    group: string; // projectId
    content: string; // 顯示內容
    start: Date; // vis-timeline 需要使用 Date 物件
    end: Date; // vis-timeline 需要使用 Date 物件
}

// Helper: Timestamp 轉 Date
function timestampToDate(ts?: Timestamp | null): Date | undefined {
    return ts ? ts.toDate() : undefined;
}

// Helper: Date 轉 Timestamp
function dateToTimestamp(date: Date | null | undefined): Timestamp | undefined {
    return date ? Timestamp.fromDate(date) : undefined;
}

// Helper: DateType 轉 Date
function toDate(dateInput: DateType): Date {
    if (dateInput instanceof Date) {
        return dateInput;
    }
    if (dateInput && typeof dateInput === 'object' && 'toDate' in dateInput) {
        return (dateInput as unknown as Timestamp).toDate();
    }
    return new Date(dateInput);
}

export default function ProjectsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [groups, setGroups] = useState<Group[]>([]);
    const [allItems, setAllItems] = useState<TimelineSubWorkpackage[]>([]);
    const [items, setItems] = useState<TimelineSubWorkpackage[]>([]);
    const [search, setSearch] = useState("");
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const timelineRef = useRef<HTMLDivElement>(null);

    const quickKeywords = ["搬運", "定位", "清潔", "測試"];

    const handleItemMove = useCallback(async (itemId: string, newStart: DateType, newEnd: DateType) => {
        const item = items.find(i => i.id === itemId);
        if (!item) return false;
        const startDate = toDate(newStart);
        const endDate = toDate(newEnd);
        const projectDocRef = doc(db, "projects", item.projectId);
        const projectSnap = await getDocs(collection(db, "projects"));
        const projectDoc = projectSnap.docs.find(d => d.id === item.projectId);
        if (!projectDoc) return false;
        const projectData = projectDoc.data();
        const workpackages: Workpackage[] = projectData.workpackages || [];
        const updatedWorkpackages = workpackages.map(wp => {
            if (wp.id !== item.workpackageId) return wp;
            return {
                ...wp,
                subWorkpackages: wp.subWorkpackages.map(sw =>
                    sw.id === item.id
                        ? {
                            ...sw,
                            estimatedStartDate: dateToTimestamp(startDate),
                            estimatedEndDate: dateToTimestamp(endDate)
                        }
                        : sw
                ),
            };
        });
        await updateDoc(projectDocRef, { workpackages: updatedWorkpackages });
        setItems(prev => prev.map(i => {
            if (i.id === itemId) {
                const startTimestamp = dateToTimestamp(startDate);
                const endTimestamp = dateToTimestamp(endDate);
                return {
                    ...i,
                    start: startDate,
                    end: endDate,
                    estimatedStartDate: startTimestamp,
                    estimatedEndDate: endTimestamp
                };
            }
            return i;
        }));
        return true;
    }, [items]);

    useEffect(() => {
        (async () => {
            const projects = await getDocs(collection(db, "projects"));
            const groupList: Group[] = projects.docs.map((d): Group => ({
                id: d.id,
                content: (d.data().projectName as string) || d.id
            }));
            setGroups(groupList);
            const all: TimelineSubWorkpackage[] = [];
            for (const project of projects.docs) {
                const projectData = project.data();
                const projectId = project.id;
                const projectName = (projectData.projectName as string) || projectId;
                const workpackages: Workpackage[] = (projectData.workpackages as Workpackage[]) || [];
                for (const wp of workpackages) {
                    const workpackageId = wp.id;
                    const workpackageName = wp.name;
                    const subWorkpackages: SubWorkpackage[] = wp.subWorkpackages || [];
                    for (const sub of subWorkpackages) {
                        const start = timestampToDate(sub.estimatedStartDate);
                        const end = timestampToDate(sub.estimatedEndDate);
                        if (start && end) {
                            all.push({
                                ...sub,
                                projectId,
                                projectName,
                                workpackageId,
                                workpackageName,
                                group: projectId,
                                content: `${workpackageName} - ${sub.name}`,
                                start,
                                end,
                            });
                        }
                    }
                }
            }
            setAllItems(all);
            setItems(all);
        })();
    }, []);

    const toggleKeyword = (keyword: string) => {
        setSelectedKeywords(prev =>
            prev.includes(keyword)
                ? prev.filter(k => k !== keyword)
                : [...prev, keyword]
        );
    };

    useEffect(() => {
        let filtered = allItems;
        const s = search.trim().toLowerCase();
        const searchKeywords = s ? s.split(/\s+|,|;/).filter(Boolean) : [];
        if (selectedKeywords.length > 0 || searchKeywords.length > 0) {
            filtered = allItems.filter(item => {
                const name = item.name.toLowerCase();
                const desc = item.description?.toLowerCase() || "";
                const matchKeyword = selectedKeywords.some(k => name.includes(k) || desc.includes(k));
                const matchSearch = searchKeywords.some(kw => name.includes(kw) || desc.includes(kw));
                return (selectedKeywords.length > 0 ? matchKeyword : false) || (searchKeywords.length > 0 ? matchSearch : false);
            });
        }
        setItems(filtered);
    }, [search, selectedKeywords, allItems]);

    useEffect(() => {
        if (!timelineRef.current || groups.length === 0) return;
        const groupsDataSet = new DataSet<Group>(groups);
        const itemsDataSet = new DataSet<TimelineSubWorkpackage>(items);
        const timelineOptions: TimelineOptions = {
            editable: { add: false, remove: false, updateTime: true, updateGroup: false },
            onMove: async (item: TimelineItem, callback: (item: TimelineItem | null) => void) => {
                const success = await handleItemMove(String(item.id), item.start!, item.end!);
                callback(success ? item : null);
            },
        };
        const timeline = new Timeline(timelineRef.current, itemsDataSet, groupsDataSet, timelineOptions);
        return () => timeline.destroy();
    }, [groups, items, handleItemMove]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return (
        <main className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen p-4">
            <div className="flex justify-end mb-2">
                <button
                    className="px-3 py-1 rounded text-sm border bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-100 flex items-center"
                    onClick={() => {
                        if (timelineRef.current) {
                            if (document.fullscreenElement) {
                                document.exitFullscreen();
                            } else {
                                timelineRef.current.requestFullscreen();
                            }
                        }
                    }}
                    type="button"
                    aria-label={isFullscreen ? '退出全螢幕' : '全螢幕'}
                >
                    {isFullscreen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15H5v4m0 0h4m-4 0l5-5m5-5h4V5m0 0h-4m4 0l-5 5" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9V5h4m0 0v4m0-4l-5 5m-6 6v4H5m0 0v-4m0 4l5-5" /></svg>
                    )}
                </button>
            </div>
            <div
                ref={timelineRef}
                style={{ height: 600 }}
                className="bg-white dark:bg-gray-800 rounded shadow mb-4"
            />
            <div className="mb-2 flex flex-wrap gap-2">
                {quickKeywords.map(keyword => (
                    <button
                        key={keyword}
                        className={`px-3 py-1 rounded text-sm border transition-all duration-100 ${selectedKeywords.includes(keyword) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600'}`}
                        onClick={() => toggleKeyword(keyword)}
                        type="button"
                    >
                        {keyword}
                    </button>
                ))}
            </div>
            <div className="mb-4 flex">
                <input
                    type="text"
                    className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-900 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700"
                    placeholder="搜尋子工作包名稱或描述"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                可用「空白、逗號、分號」分隔多個關鍵字進行搜尋
            </div>
        </main>
    );
}