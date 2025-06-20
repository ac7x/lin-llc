/**
 * 排程頁面
 *
 * 使用 vis-timeline 實現的排程視覺化介面，功能包含：
 * - 專案時間軸顯示
 * - 子工作包拖曳調整時間
 * - 關鍵字快速篩選
 * - 全螢幕模式
 * - 即時更新排程
 */

'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import VisTimeline from '@/components/common/VisTimeline';
import { db } from '@/lib/firebase-client';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { SubWorkpackage, Workpackage } from '@/types/project';
import { TimelineGroup, TimelineItem } from '@/types/timeline';
import { timestampToDate, dateToTimestamp, toDate } from '@/utils/timelineUtils';

// 專案排程頁面使用的特定 item 類型，擴充通用 TimelineItem
interface ScheduleTimelineItem extends TimelineItem {
  projectId: string;
  projectName: string;
  workpackageId: string;
  workpackageName: string;
  description?: string;
  name: string;
  hasEndDate?: boolean;
}

export default function ProjectsPage() {
  const [groups, setGroups] = useState<TimelineGroup[]>([]);
  const [allItems, setAllItems] = useState<ScheduleTimelineItem[]>([]);
  const [items, setItems] = useState<ScheduleTimelineItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  const quickKeywords = ['搬運', '定位', '清潔', '測試'];

  const handleItemMove = useCallback(async (item: TimelineItem) => {
    const movedItem = item as ScheduleTimelineItem;
    if (!movedItem) return false;

    const startDate = toDate(movedItem.start);
    const endDate = toDate(movedItem.end!);

    try {
      const projectDocRef = doc(db, 'projects', movedItem.projectId);
      // We need to read the doc to get the latest workpackages array
      const projectSnap = await getDocs(collection(db, 'projects'));
      const projectDoc = projectSnap.docs.find(d => d.id === movedItem.projectId);
      if (!projectDoc) {
        console.error('Project not found');
        return false;
      }

      const projectData = projectDoc.data();
      const workpackages: Workpackage[] = projectData.workpackages || [];

      const updatedWorkpackages = workpackages.map(wp => {
        if (wp.id !== movedItem.workpackageId) return wp;
        return {
          ...wp,
          subWorkpackages: wp.subWorkpackages.map(sw =>
            sw.id === movedItem.id
              ? {
                  ...sw,
                  plannedStartDate: dateToTimestamp(startDate),
                  plannedEndDate: dateToTimestamp(endDate),
                }
              : sw
          ),
        };
      });

      await updateDoc(projectDocRef, { workpackages: updatedWorkpackages });

      // Optimistically update local state
      setItems(prev =>
        prev.map(i => {
          if (i.id === movedItem.id) {
            return { ...i, start: startDate, end: endDate };
          }
          return i;
        })
      );
      setAllItems(prev =>
        prev.map(i => {
          if (i.id === movedItem.id) {
            return { ...i, start: startDate, end: endDate };
          }
          return i;
        })
      );

      return true;
    } catch (error) {
      console.error('Error updating document: ', error);
      return false;
    }
  }, []);

  useEffect(() => {
    (async () => {
      const projects = await getDocs(collection(db, 'projects'));
      const groupList: TimelineGroup[] = projects.docs.map(
        (d): TimelineGroup => ({
          id: d.id,
          content: (d.data().projectName as string) || d.id,
        })
      );
      setGroups(groupList);

      const all: ScheduleTimelineItem[] = [];
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
            const plannedStart = timestampToDate(sub.plannedStartDate);
            const plannedEnd = timestampToDate(sub.plannedEndDate);

            if (plannedStart || plannedEnd) {
              const start =
                plannedStart ||
                (plannedEnd ? new Date(plannedEnd.getTime() - 24 * 60 * 60 * 1000) : new Date());
              const end =
                plannedEnd ||
                (plannedStart
                  ? new Date(plannedStart.getTime() + 24 * 60 * 60 * 1000)
                  : new Date());
              const hasEndDate = !!plannedEnd;
              const content = hasEndDate
                ? `${workpackageName} - ${sub.name}`
                : `${workpackageName} - ${sub.name} (結束日期未設置)`;

              all.push({
                ...sub,
                id: sub.id,
                content,
                start,
                end,
                group: projectId,
                projectId,
                projectName,
                workpackageId,
                workpackageName,
                hasEndDate,
                name: sub.name,
                description: sub.description,
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
      prev.includes(keyword) ? prev.filter(k => k !== keyword) : [...prev, keyword]
    );
  };

  useEffect(() => {
    let filtered = allItems;
    const s = search.trim().toLowerCase();
    const searchKeywords = s ? s.split(/\s+|,|;/).filter(Boolean) : [];
    if (selectedKeywords.length > 0 || searchKeywords.length > 0) {
      filtered = allItems.filter(item => {
        const name = item.name.toLowerCase();
        const desc = item.description?.toLowerCase() || '';
        const matchKeyword = selectedKeywords.some(k => name.includes(k) || desc.includes(k));
        const matchSearch = searchKeywords.some(kw => name.includes(kw) || desc.includes(kw));
        const hasSelectedKeywords = selectedKeywords.length > 0;
        const hasSearchKeywords = searchKeywords.length > 0;

        if (hasSelectedKeywords && hasSearchKeywords) {
          return matchKeyword && matchSearch;
        }
        if (hasSelectedKeywords) {
          return matchKeyword;
        }
        if (hasSearchKeywords) {
          return matchSearch;
        }
        return false;
      });
    }
    setItems(filtered);
  }, [search, selectedKeywords, allItems]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const onMoveHandler = async (
    item: TimelineItem,
    callback: (item: TimelineItem | null) => void
  ) => {
    const success = await handleItemMove(item);
    callback(success ? item : null);
  };

  return (
    <main className='max-w-4xl mx-auto'>
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4'>
          <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent'>
            排程
          </h1>
          <button
            className='px-3 py-1.5 rounded-lg text-sm border bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-200 flex items-center gap-2'
            onClick={() => {
              const container = timelineContainerRef.current;
              if (container) {
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                } else {
                  container.requestFullscreen();
                }
              }
            }}
            type='button'
            aria-label={isFullscreen ? '退出全螢幕' : '全螢幕'}
          >
            {isFullscreen ? (
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-5 w-5'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 15H5v4m0 0h4m-4 0l5-5m5-5h4V5m0 0h-4m4 0l-5 5'
                />
              </svg>
            ) : (
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-5 w-5'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 9V5h4m0 0v4m0-4l-5 5m-6 6v4H5m0 0v-4m0 4l5-5'
                />
              </svg>
            )}
            {isFullscreen ? '退出全螢幕' : '全螢幕'}
          </button>
        </div>

        <VisTimeline
          ref={timelineContainerRef}
          items={items}
          groups={groups}
          onMove={onMoveHandler}
          className='bg-white dark:bg-gray-900 rounded-lg shadow mb-6'
        />

        <div className='mb-4'>
          <div className='flex flex-wrap gap-2 mb-4'>
            {quickKeywords.map(keyword => (
              <button
                key={keyword}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-all duration-200 ${
                  selectedKeywords.includes(keyword)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => toggleKeyword(keyword)}
                type='button'
              >
                {keyword}
              </button>
            ))}
          </div>

          <div className='relative'>
            <input
              type='text'
              className='w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200'
              placeholder='搜尋子工作包名稱或描述'
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400'>🔍</span>
          </div>
          <div className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
            可用「空白、逗號、分號」分隔多個關鍵字進行搜尋
          </div>
        </div>

        <div className='bg-white dark:bg-gray-900 rounded-lg shadow p-4'>
          <h2 className='text-lg font-medium mb-4 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent'>
            說明
          </h2>
          <div className='text-sm text-gray-600 dark:text-gray-400 space-y-2'>
            <p>• 標題中顯示「(結束日期未設置)」的項目表示只有開始日期，沒有設置結束日期</p>
            <p>• 您可以拖曳調整項目的開始和結束時間，系統會自動更新資料庫</p>
            <p>• 使用關鍵字按鈕或搜尋框可以快速篩選特定類型的工作包</p>
          </div>
        </div>
      </div>
    </main>
  );
}
