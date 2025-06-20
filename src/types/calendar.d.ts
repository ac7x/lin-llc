/**
 * @fileoverview Calendar related types
 * @module types/calendar
 */
import { Timestamp } from "firebase/firestore";

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  progress?: number;
  actualStartDate?: Date;
  actualEndDate?: Date;
  hasEndDate?: boolean;
  projectName?: string;
  workpackageId?: string;
  workpackageName?: string;
  quantity?: number;
  resourceId?: string;
}

export interface Schedulable {
  id: string;
  name: string;
  plannedStartDate?: Timestamp;
  plannedEndDate?: Timestamp;
  actualStartDate?: Timestamp;
  actualEndDate?: Timestamp;
  progress?: number;
} 