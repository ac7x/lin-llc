'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Timeline, DataSet, TimelineOptions } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import { TimelineItem, TimelineGroup } from '@/types/timeline';

interface VisTimelineProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onMove'> {
  items: TimelineItem[];
  groups: TimelineGroup[];
  options?: TimelineOptions;
  onMove?: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void;
}

const VisTimeline = forwardRef<HTMLDivElement, VisTimelineProps>(
  ({ items, groups, options, onMove, style, ...rest }, ref) => {
    const internalTimelineRef = useRef<HTMLDivElement>(null);

    // Expose the internal ref to the parent component
    useImperativeHandle(ref, () => internalTimelineRef.current as HTMLDivElement);

    useEffect(() => {
      if (!internalTimelineRef.current) return;

      const itemsDataSet = new DataSet<TimelineItem>(items);
      const groupsDataSet = new DataSet<TimelineGroup>(groups);

      const defaultOptions: TimelineOptions = {
        editable: { add: false, remove: false, updateTime: true, updateGroup: false },
        stack: true,
        zoomMin: 1000 * 60 * 60 * 24, // 1 day
        margin: {
          item: {
            horizontal: 0,
          },
        },
      };

      const timelineOptions: TimelineOptions = { ...defaultOptions, ...options };

      if (onMove) {
        timelineOptions.onMove = (item, callback) => {
          const movedItem = items.find(i => i.id === item.id);
          if (movedItem) {
            const updatedItem: TimelineItem = {
              ...movedItem,
              start: item.start as Date,
              end: item.end as Date,
            };
            onMove(updatedItem, callback as (item: TimelineItem | null) => void);
          } else {
            callback(null);
          }
        };
      }

      const timeline = new Timeline(
        internalTimelineRef.current,
        itemsDataSet,
        groupsDataSet,
        timelineOptions
      );

      return () => {
        timeline.destroy();
      };
    }, [items, groups, options, onMove]);

    const defaultContainerStyle: React.CSSProperties = {
      height: '600px',
    };

    return (
      <div ref={internalTimelineRef} style={{ ...defaultContainerStyle, ...style }} {...rest} />
    );
  }
);

VisTimeline.displayName = 'VisTimeline';

export default VisTimeline;
