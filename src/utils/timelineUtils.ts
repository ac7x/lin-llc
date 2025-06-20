import { Timestamp } from 'firebase/firestore';
import { DateType } from 'vis-timeline/standalone';

/**
 * Converts a Firestore Timestamp to a JavaScript Date object.
 * @param ts - The Firestore Timestamp or null/undefined.
 * @returns A Date object or undefined.
 */
export function timestampToDate(ts?: Timestamp | null): Date | undefined {
  return ts ? ts.toDate() : undefined;
}

/**
 * Converts a JavaScript Date object to a Firestore Timestamp.
 * @param date - The Date object or null/undefined.
 * @returns A Firestore Timestamp or undefined.
 */
export function dateToTimestamp(date: Date | null | undefined): Timestamp | undefined {
  return date ? Timestamp.fromDate(date) : undefined;
}

/**
 * Converts a vis-timeline DateType to a JavaScript Date object.
 * DateType can be a Date, number, or string.
 * @param dateInput - The DateType from vis-timeline.
 * @returns A Date object.
 */
export function toDate(dateInput: DateType): Date {
  if (dateInput instanceof Date) {
    return dateInput;
  }
  // Handle case where it might be a Firestore Timestamp-like object from callback
  if (
    dateInput &&
    typeof dateInput === 'object' &&
    'toDate' in dateInput &&
    typeof (dateInput as { toDate: unknown }).toDate === 'function'
  ) {
    return (dateInput as { toDate: () => Date }).toDate();
  }
  return new Date(dateInput);
}
