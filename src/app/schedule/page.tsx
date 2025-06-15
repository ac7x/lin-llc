/**
 * 專案排程頁面
 * 
 * 使用 vis-timeline 實現的專案排程視覺化介面，功能包含：
 * - 專案時間軸顯示
 * - 子工作包拖曳調整時間
 * - 關鍵字快速篩選
 * - 全螢幕模式
 * - 即時更新排程
 */

"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Timeline, DataSet, TimelineItem, TimelineGroup, TimelineOptions, DateType } from "vis-timeline/standalone";
import { db } from "@/lib/firebase-client";
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { SubWorkpackage, Workpackage } from "@/types/project";
import { Timestamp } from "firebase/firestore";
import { useAuth } from '@/hooks/useAuth';

// 定義導航權限項目的型別
interface NavPermissionItem {
    id: string;
    defaultRoles: string[];
}

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
    const { user, userRoles, loading: authLoading } = useAuth();
    const [groups, setGroups] = useState<Group[]>([]);
    const [allItems, setAllItems] = useState<TimelineSubWorkpackage[]>([]);
    const [items, setItems] = useState<TimelineSubWorkpackage[]>([]);
    const [search, setSearch] = useState("");
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const timelineRef = useRef<HTMLDivElement>(null);
    const [authState, setAuthState] = useState<{
        hasPermission: boolean | null;
        isLoading: boolean;
    }>({
        hasPermission: null,
        isLoading: true
    });

    const quickKeywords = ["搬運", "定位", "清潔", "測試"];

    // 檢查導航權限
    useEffect(() => {
        async function checkNavPermission() {
            // 如果 auth 還在載入中，不進行權限檢查
            if (authLoading) {
                return;
            }

            if (!user || !userRoles) {
                setAuthState({
                    hasPermission: false,
                    isLoading: false
                });
                return;
            }

            try {
                const navPermissionsDoc = await getDoc(doc(db, 'settings', 'navPermissions'));
                if (!navPermissionsDoc.exists()) {
                    setAuthState({
                        hasPermission: false,
                        isLoading: false
                    });
                    return;
                }

                const data = navPermissionsDoc.data();
                const scheduleNav = data.items?.find((item: NavPermissionItem) => item.id === 'schedule');
                
                if (!scheduleNav) {
                    setAuthState({
                        hasPermission: false,
                        isLoading: false
                    });
                    return;
                }

                // 檢查用戶角色是否有權限
                const hasAccess = userRoles.some(role => 
                    scheduleNav.defaultRoles.includes(role)
                );

                setAuthState({
                    hasPermission: hasAccess,
                    isLoading: false
                });
            } catch (error) {
                console.error('檢查導航權限失敗:', error);
                setAuthState({
                    hasPermission: false,
                    isLoading: false
                });
            }
        }

        checkNavPermission();
    }, [user, userRoles, authLoading]);

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

    // 如果正在載入權限，顯示載入中
    if (authState.isLoading) {
        return (
            <main className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </main>
        );
    }

    // 如果沒有權限，顯示拒絕存取訊息
    if (!authState.hasPermission) {
        return (
            <main className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div className="flex flex-col items-center justify-center py-12">
                        <svg className="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">存取被拒絕</h2>
                        <p className="text-gray-600 dark:text-gray-400">您沒有權限存取此頁面</p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">專案排程</h1>
                    <button
                        className="px-3 py-1.5 rounded-lg text-sm border bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-200 flex items-center gap-2"
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
                        {isFullscreen ? '退出全螢幕' : '全螢幕'}
                    </button>
                </div>

                <div
                    ref={timelineRef}
                    style={{ height: 600 }}
                    className="bg-white dark:bg-gray-900 rounded-lg shadow mb-6"
                />

                <div className="mb-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {quickKeywords.map(keyword => (
                            <button
                                key={keyword}
                                className={`px-3 py-1.5 rounded-lg text-sm border transition-all duration-200 ${
                                    selectedKeywords.includes(keyword)
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-800'
                                }`}
                                onClick={() => toggleKeyword(keyword)}
                                type="button"
                            >
                                {keyword}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                            placeholder="搜尋子工作包名稱或描述"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            🔍
                        </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        可用「空白、逗號、分號」分隔多個關鍵字進行搜尋
                    </div>
                </div>
            </div>
        </main>
    );
}