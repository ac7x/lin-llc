"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { zhTW } from "date-fns/locale";
import "@/styles/react-big-calendar.css";

import { db, collection, getDocs } from "@/lib/firebase-client";
import { Workpackage } from "@/types/project";
import { ProgressColorScale } from "@/utils/colorScales";

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
                        // 修正：Timestamp 需轉 Date
                        if (wp.estimatedStartDate && wp.estimatedEndDate && typeof wp.estimatedStartDate.toDate === "function" && typeof wp.estimatedEndDate.toDate === "function") {
                            const startDate = wp.estimatedStartDate.toDate();
                            const endDate = wp.estimatedEndDate.toDate();
                            endDate.setDate(endDate.getDate() + 1);

                            calendarEvents.push({
                                id: wp.id,
                                title: `${project.projectName} - ${wp.name}`,
                                start: startDate,
                                end: endDate,
                                projectName: project.projectName,
                                workpackageId: wp.id,
                                progress: wp.progress,
                                actualStartDate: wp.actualStartDate && typeof wp.actualStartDate.toDate === "function" ? wp.actualStartDate.toDate() : undefined,
                                actualEndDate: wp.actualEndDate && typeof wp.actualEndDate.toDate === "function" ? wp.actualEndDate.toDate() : undefined
                            });
                        }

                        // 加入子工作包
                        wp.subWorkpackages?.forEach(sub => {
                            if (sub.estimatedStartDate && sub.estimatedEndDate && typeof sub.estimatedStartDate.toDate === "function" && typeof sub.estimatedEndDate.toDate === "function") {
                                const startDate = sub.estimatedStartDate.toDate();
                                const endDate = sub.estimatedEndDate.toDate();
                                endDate.setDate(endDate.getDate() + 1);

                                calendarEvents.push({
                                    id: sub.id,
                                    title: `${project.projectName} - ${wp.name} - ${sub.name}`,
                                    start: startDate,
                                    end: endDate,
                                    projectName: project.projectName,
                                    workpackageId: wp.id,
                                    progress: sub.progress,
                                    actualStartDate: sub.actualStartDate && typeof sub.actualStartDate.toDate === "function" ? sub.actualStartDate.toDate() : undefined,
                                    actualEndDate: sub.actualEndDate && typeof sub.actualEndDate.toDate === "function" ? sub.actualEndDate.toDate() : undefined
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
    }, []); // <-- 只在 mount 時執行

    const eventStyleGetter = (event: CalendarEvent) => {
        let backgroundColor = "#3174ad";
        let borderColor = "transparent";
        let borderStyle = "solid";

        // 使用 ProgressColorScale 決定顏色
        if (event.progress !== undefined) {
            const scale = ProgressColorScale.find(
                s => event.progress! >= s.min && event.progress! <= s.max
            );
            if (scale) backgroundColor = scale.color;
        }

        // 如果有實際日期，使用不同的邊框樣式
        if (event.actualStartDate || event.actualEndDate) {
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

        // 參考 project-calendar/page.tsx，將預計/實際時間合併顯示，條件顏色一致
        return (
            <div className="p-1">
                <div className="text-xs text-gray-600">
                    {event.title}
                    {typeof event.progress === "number" && ` | 進度: ${event.progress}%`}
                    {` | 預計: ${format(event.start, 'MM/dd')}-${format(new Date(event.end.getTime() - 24 * 60 * 60 * 1000), 'MM/dd')}`}
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
        const estimatedDateRange = `預計：${format(event.start, "yyyy-MM-dd")} 至 ${format(new Date(event.end.getTime() - 24 * 60 * 60 * 1000), "yyyy-MM-dd")}`;
        const actualDateRange = event.actualStartDate || event.actualEndDate ?
            `\n實際：${event.actualStartDate ? format(event.actualStartDate, "yyyy-MM-dd") : "尚未開始"} 至 ${event.actualEndDate ? format(event.actualEndDate, "yyyy-MM-dd") : "進行中"}` : "";

        alert(`工作包: ${event.title}
所屬專案: ${event.projectName}
${estimatedDateRange}${actualDateRange}
進度: ${event.progress}%`);
    };

    // 新增 formats 讓月曆標題與週標題顯示中文
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

    // chips + 搜尋框多關鍵字 OR 過濾
    const filteredEvents = events.filter(event => {
        // 準備搜尋框多關鍵字（空白、逗號、分號分隔）
        const s = searchTerm.trim().toLowerCase();
        const searchKeywords = s ? s.split(/\s+|,|;/).filter(Boolean) : [];
        // 若都沒填，顯示全部
        if (searchKeywords.length === 0) return true;
        // 事件可被搜尋框任一命中就顯示
        const fields = [event.title, event.projectName, typeof event.progress === "number" ? `${event.progress}` : ""];
        const matchSearch = searchKeywords.length > 0 && searchKeywords.some(kw => fields.some(f => f?.toLowerCase().includes(kw)));
        return matchSearch;
    });

    if (loading) return <div className="p-4">載入中...</div>;
    if (error) return <div className="p-4 text-red-500">錯誤: {error}</div>;

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">專案行事曆</h1>
            <div className="mb-4 flex flex-col md:flex-row md:justify-between md:items-center gap-2 md:gap-0">
                <div className="flex items-center gap-2">
                    <select
                        value={view}
                        onChange={e => setView(e.target.value as "month" | "week" | "day" | "agenda")}
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-base text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition"
                    >
                        <option value="month">月檢視</option>
                        <option value="week">週檢視</option>
                        <option value="day">日檢視</option>
                        <option value="agenda">列表檢視</option>
                    </select>
                    <input
                        type="text"
                        placeholder="搜尋事件/專案/進度..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="ml-2 block w-40 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-base text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition"
                    />
                    <button
                        type="button"
                        onClick={handleFullscreen}
                        className="ml-2 px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 hover:text-white transition"
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
                <div className="text-sm text-gray-500">
                    顯示 {filteredEvents.length} / {events.length} 個工作包排程
                </div>
            </div>
            <div
                ref={calendarContainerRef}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6${isFullscreen ? " fixed inset-0 z-50 !rounded-none !mb-0 !p-0 !max-w-none !h-screen" : ""}`}
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h2 className="text-lg font-medium mb-2">圖例說明</h2>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex flex-wrap gap-4 items-center">
                        {/* 進度狀態 */}
                        {ProgressColorScale.map((s, i) => (
                            <span className="flex items-center" key={i}>
                                <div className="w-4 h-3 mr-1" style={{ background: s.color }}></div>
                                <span className="text-sm mr-2">
                                    {s.min}%
                                    {s.max !== s.min && `~${s.max}%`}
                                    {s.max === 100 && " 完成"}
                                </span>
                            </span>
                        ))}
                        {/* 時間狀態 */}
                        <span className="flex items-center">
                            <div className="w-10 h-2.5 bg-blue-500 mr-1"></div>
                            <span className="text-sm mr-2">預計時間</span>
                        </span>
                        <span className="flex items-center">
                            <div className="w-10 h-2.5 border-l-4 border-blue-500 bg-blue-100 mr-1"></div>
                            <span className="text-sm mr-4">實際時間</span>
                        </span>
                        {/* 圖示說明 */}
                        <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm mr-2">預計日期</span>
                        </span>
                        <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span className="text-sm">實際日期</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}