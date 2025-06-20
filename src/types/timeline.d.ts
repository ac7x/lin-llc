import { TimelineGroup as VisTimelineGroup, TimelineItem as VisTimelineItem } from "vis-timeline/standalone";

export interface TimelineGroup extends VisTimelineGroup {
  id: string;
  content: string;
}

export interface TimelineItem extends VisTimelineItem {
  id: string;
  content: string;
  start: Date;
  end?: Date;
  group: string;
} 