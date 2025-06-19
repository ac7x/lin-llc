/**
 * 全域行事曆頁面
 * 
 * 提供所有專案和工作的行事曆視圖，功能包含：
 * - 跨排程顯示
 * - 工作包進度追蹤
 * - 日期範圍管理
 * - 全螢幕模式
 * - 事件詳細資訊
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { zhTW } from "date-fns/locale";
import "@/styles/react-big-calendar.css";
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { Workpackage } from "@/types/project";
import { ProgressColorScale, getProgressInfo } from "@/utils/colorUtils";

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales: { "zh-TW": zhTW }
});

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    projectName?: string;
    workpackageId?: string;
    allDay?: boolean;
    progress?: number;
    resourceId?: string;
    actualStartDate?: Date;
    actualEndDate?: Date;
    hasEndDate?: boolean;
}

export default function ProjectCalendarPage() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [view, setView] = useState<"month" | "week" | "day" | "agenda">("month");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const calendarContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchAllWorkpackages() {
            setLoading(true);
            try {
                const projectsSnapshot = await getDocs(collection(db, "projects"));
                const calendarEvents: CalendarEvent[] = [];

                projectsSnapshot.forEach(docSnap => {
                    const project = docSnap.data();
                    project.workpackages?.forEach((wp: Workpackage) => {
                        if (wp.plannedStartDate && typeof wp.plannedStartDate.toDate === "function") {
                            const startDate = wp.plannedStartDate.toDate();
                            let endDate: Date;
                            let hasEndDate = false;

                            if (wp.plannedEndDate && typeof wp.plannedEndDate.toDate === "function") {
                                endDate = wp.plannedEndDate.toDate();
                                endDate.setDate(endDate.getDate() + 1);
                                hasEndDate = true;
                            } else {
                                endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
                                hasEndDate = false;
                            }

                            calendarEvents.push({
                                id: wp.id,
                                title: `${project.projectName} - ${wp.name}`,
                                start: startDate,
                                end: endDate,
                                projectName: project.projectName,
                                workpackageId: wp.id,
                                progress: wp.progress,
                                actualStartDate: wp.actualStartDate && typeof wp.actualStartDate.toDate === "function" ? wp.actualStartDate.toDate() : undefined,
                                actualEndDate: wp.actualEndDate && typeof wp.actualEndDate.toDate === "function" ? wp.actualEndDate.toDate() : undefined,
                                hasEndDate
                            });
                        }

                        wp.subWorkpackages?.forEach(sub => {
                            if (sub.plannedStartDate && typeof sub.plannedStartDate.toDate === "function") {
                                const startDate = sub.plannedStartDate.toDate();
                                let endDate: Date;
                                let hasEndDate = false;

                                if (sub.plannedEndDate && typeof sub.plannedEndDate.toDate === "function") {
                                    endDate = sub.plannedEndDate.toDate();
                                    endDate.setDate(endDate.getDate() + 1);
                                    hasEndDate = true;
                                } else {
                                    endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
                                    hasEndDate = false;
                                }

                                calendarEvents.push({
                                    id: sub.id,
                                    title: `${project.projectName} - ${wp.name} - ${sub.name}`,
                                    start: startDate,
                                    end: endDate,
                                    projectName: project.projectName,
                                    workpackageId: wp.id,
                                    progress: sub.progress,
                                    actualStartDate: sub.actualStartDate && typeof sub.actualStartDate.toDate === "function" ? sub.actualStartDate.toDate() : undefined,
                                    actualEndDate: sub.actualEndDate && typeof sub.actualEndDate.toDate === "function" ? sub.actualEndDate.toDate() : undefined,
                                    hasEndDate
                                });
                            }
                        });
                    });
                });

                setEvents(calendarEvents);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : "發生錯誤");
            } finally {
                setLoading(false);
            }
        }
        fetchAllWorkpackages();
    }, []);

    const eventStyleGetter = (event: CalendarEvent) => {
        let backgroundColor = "#3174ad";
        let borderColor = "transparent";
        let borderStyle = "solid";

        if (event.progress !== undefined) {
            const progressInfo = getProgressInfo(event.progress);
            backgroundColor = progressInfo.color;
        }

        if (!event.hasEndDate) {
            borderColor = "#ff6b6b";
            borderStyle = "dashed";
        } else if (event.actualStartDate || event.actualEndDate) {
            borderColor = "#ffffff";
            borderStyle = "dashed";
        }

        return {
            style: {
                backgroundColor,
                borderRadius: "4px",
                opacity: 0.8,
                color: "white",
                border: `2px ${borderStyle} ${borderColor}`,
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis"
            }
        };
    };

    const EventComponent = ({ event }: { event: CalendarEvent }) => {
        const isDelayed = event.actualEndDate && event.end && event.actualEndDate > event.end;
        const progressInfo = event.progress !== undefined ? getProgressInfo(event.progress) : null;

        return (
            <div className="p-1">
                <div className="text-xs text-gray-600">
                    {event.title}
                    {progressInfo && (
                        <span className="font-medium" style={{ color: progressInfo.color }}>
                            {` | ${progressInfo.description} (${event.progress}%)`}
                        </span>
                    )}
                    {` | 計劃: ${format(event.start, 'MM/dd')}`}
                    {event.hasEndDate ? `-${format(new Date(event.end.getTime() - 24 * 60 * 60 * 1000), 'MM/dd')}` : ' (結束日期未設置)'}
                    {event.actualStartDate && (
                        <>
                            {` | 實際: ${format(event.actualStartDate, 'MM/dd')}`}
                            {event.actualEndDate ? `-${format(event.actualEndDate, 'MM/dd')}` : ' (進行中)'}
                        </>
                    )}
                    {isDelayed && <span className="ml-1 text-yellow-300">⚠️ 延遲</span>}
                </div>
            </div>
        );
    };

    const handleSelectEvent = (event: CalendarEvent) => {
        const plannedDateRange = event.hasEndDate 
            ? `計劃：${format(event.start, "yyyy-MM-dd")} 至 ${format(new Date(event.end.getTime() - 24 * 60 * 60 * 1000), "yyyy-MM-dd")}`
            : `計劃：${format(event.start, "yyyy-MM-dd")} (結束日期未設置)`;
        const actualDateRange = event.actualStartDate || event.actualEndDate ?
            `\n實際：${event.actualStartDate ? format(event.actualStartDate, "yyyy-MM-dd") : "尚未開始"} 至 ${event.actualEndDate ? format(event.actualEndDate, "yyyy-MM-dd") : "進行中"}` : "";
        
        const progressInfo = event.progress !== undefined ? getProgressInfo(event.progress) : null;
        const progressText = progressInfo ? `進度階段: ${progressInfo.description} (${event.progress}%)` : `進度: ${event.progress}%`;

        alert(`工作包: ${event.title}
所屬專案: ${event.projectName}
${plannedDateRange}${actualDateRange}
${progressText}`);
    };

    const formats = {
        monthHeaderFormat: (date: Date) => format(date, "yyyy年M月", { locale: zhTW }),
        weekdayFormat: (date: Date) => "週" + "日一二三四五六".charAt(getDay(date)),
        dayFormat: (date: Date) => "週" + "日一二三四五六".charAt(getDay(date)),
    };

    const handleFullscreen = () => {
        if (!calendarContainerRef.current) return;
        if (!isFullscreen) {
            if (calendarContainerRef.current.requestFullscreen) {
                calendarContainerRef.current.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    useEffect(() => {
        const onFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", onFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
    }, []);

    const filteredEvents = events.filter(event => {
        const s = searchTerm.trim().toLowerCase();
        const searchKeywords = s ? s.split(/\s+|,|;/).filter(Boolean) : [];
        if (searchKeywords.length === 0) return true;
        const fields = [event.title, event.projectName, typeof event.progress === "number" ? `${event.progress}` : ""];
        const matchSearch = searchKeywords.length > 0 && searchKeywords.some(kw => fields.some(f => f?.toLowerCase().includes(kw)));
        return matchSearch;
    });

    if (loading) return (
        <main className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            </div>
        </main>
    );
    
    if (error) return (
        <main className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="text-red-500 text-center py-4">錯誤: {error}</div>
            </div>
        </main>
    );

    return (
        <main className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">行事曆</h1>
                    <div className="flex items-center gap-2">
                        <select
                            value={view}
                            onChange={e => setView(e.target.value as "month" | "week" | "day" | "agenda")}
                            className="block rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                        >
                            <option value="month">月檢視</option>
                            <option value="week">週檢視</option>
                            <option value="day">日檢視</option>
                            <option value="agenda">列表檢視</option>
                        </select>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="搜尋事件/專案/進度..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="block w-40 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                🔍
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleFullscreen}
                            className="px-3 py-2 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-200"
                            title={isFullscreen ? "離開全螢幕" : "全螢幕"}
                        >
                            {isFullscreen ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13H5v6h6v-4m4-4h4V5h-6v4" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4M20 8V4h-4M4 16v4h4m12-4v4h-4" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    顯示 {filteredEvents.length} / {events.length} 個工作包排程
                </div>

                <div
                    ref={calendarContainerRef}
                    className={`bg-white dark:bg-gray-900 rounded-lg shadow p-4 mb-6${isFullscreen ? " fixed inset-0 z-50 !rounded-none !mb-0 !p-0 !max-w-none !h-screen" : ""}`}
                    style={{ height: isFullscreen ? "100vh" : "700px" }}
                >
                    <Calendar
                        localizer={localizer}
                        events={filteredEvents}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: "100%" }}
                        views={["month", "week", "day", "agenda"]}
                        view={view}
                        onView={newView => setView(newView as "month" | "week" | "day" | "agenda")}
                        eventPropGetter={eventStyleGetter}
                        components={{ event: EventComponent }}
                        onSelectEvent={handleSelectEvent}
                        formats={formats}
                        messages={{
                            allDay: "全天",
                            previous: "上一個",
                            next: "下一個",
                            today: "今天",
                            month: "月",
                            week: "週",
                            day: "日",
                            agenda: "列表",
                            date: "日期",
                            time: "時間",
                            event: "事件",
                            noEventsInRange: "此範圍內沒有排程"
                        }}
                    />
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
                    <h2 className="text-lg font-medium mb-4 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">進度階段圖例</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {/* 進度階段 */}
                        {ProgressColorScale.map((scale, i) => {
                            const progressInfo = getProgressInfo(scale.min);
                            return (
                                <div key={i} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm">
                                    <div 
                                        className="w-6 h-4 rounded-md shadow-sm" 
                                        style={{ backgroundColor: scale.color }}
                                    ></div>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {progressInfo.description}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {scale.min}% - {scale.max}%
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                        <h3 className="text-md font-medium mb-3 text-gray-900 dark:text-gray-100">時間狀態說明</h3>
                        <div className="flex flex-wrap gap-4 items-center">
                            <span className="flex items-center">
                                <div className="w-10 h-2.5 bg-blue-500 mr-2 rounded"></div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">計劃時間</span>
                            </span>
                            <span className="flex items-center">
                                <div className="w-10 h-2.5 border-l-4 border-blue-500 bg-blue-100 mr-2 rounded"></div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">實際時間</span>
                            </span>
                            <span className="flex items-center">
                                <div className="w-10 h-2.5 border-2 border-dashed border-red-400 bg-blue-500 mr-2 rounded"></div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">結束日期未設置</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}