'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Timeline } from 'vis-timeline/standalone';
import { DataSet } from 'vis-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import 'vis-timeline/styles/vis-timeline-graph2d.css';

interface ScheduleItem {
  id: string;
  content: string;
  start: Date;
  end: Date;
  group?: string;
}

interface ProjectScheduleProps {
  projectId: string;
}

export default function ProjectSchedule({ projectId }: ProjectScheduleProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timeline = useRef<Timeline | null>(null);
  
  const [items] = useState(() => new DataSet([
    {
      id: '1',
      content: '專案規劃',
      start: new Date('2024-01-15'),
      end: new Date('2024-01-20'),
      group: 'planning'
    },
    {
      id: '2',
      content: '需求分析',
      start: new Date('2024-01-18'),
      end: new Date('2024-01-25'),
      group: 'analysis'
    },
    {
      id: '3',
      content: '系統設計',
      start: new Date('2024-01-22'),
      end: new Date('2024-02-05'),
      group: 'design'
    },
    {
      id: '4',
      content: '開發實作',
      start: new Date('2024-02-01'),
      end: new Date('2024-02-28'),
      group: 'development'
    },
    {
      id: '5',
      content: '測試驗證',
      start: new Date('2024-02-25'),
      end: new Date('2024-03-10'),
      group: 'testing'
    }
  ]));

  const [groups] = useState(() => new DataSet([
    { id: 'planning', content: '規劃階段' },
    { id: 'analysis', content: '分析階段' },
    { id: 'design', content: '設計階段' },
    { id: 'development', content: '開發階段' },
    { id: 'testing', content: '測試階段' }
  ]));

  useEffect(() => {
    if (timelineRef.current && !timeline.current) {
      const options = {
        editable: {
          add: true,
          updateTime: true,
          updateGroup: true,
          remove: true
        },
        stack: false,
        showCurrentTime: true,
        zoomMin: 1000 * 60 * 60 * 24, // 一天
        zoomMax: 1000 * 60 * 60 * 24 * 365, // 一年
        orientation: 'top',
        locale: 'zh-TW'
      };

      timeline.current = new Timeline(
        timelineRef.current,
        items,
        groups,
        options
      );

      // 監聽項目更新事件
      timeline.current.on('itemUpdate', (item: any) => {
        console.log('更新項目:', item);
      });

      // 監聽項目移動事件
      timeline.current.on('itemMove', (item: any) => {
        console.log('移動項目:', item);
      });
    }

    return () => {
      if (timeline.current) {
        timeline.current.destroy();
        timeline.current = null;
      }
    };
  }, [items, groups]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>專案甘特圖</CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={timelineRef} 
          style={{ 
            height: '400px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
        <div className="mt-4 text-sm text-gray-600">
          <p>• 拖曳項目以調整時間</p>
          <p>• 雙擊空白處新增項目</p>
          <p>• 右鍵點擊項目進行編輯或刪除</p>
        </div>
      </CardContent>
    </Card>
  );
} 