import { 
  DocumentData,
  WithFieldValue,
  where,
  orderBy,
  limit,
  startAt,
  startAfter,
  endAt,
  endBefore,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';
import { firebaseService } from '../services/firebase.service';

export const firestoreUtils = {
  async getDocument<T extends DocumentData>(path: string): Promise<T | null> {
    return firebaseService.getDocumentData<T>(path);
  },

  async setDocument<T extends WithFieldValue<DocumentData>>(path: string, data: T) {
    return firebaseService.setDocument(path, data);
  },

  async updateDocument<T extends Partial<WithFieldValue<DocumentData>>>(path: string, data: T) {
    return firebaseService.updateDocument(path, data);
  },

  async deleteDocument(path: string) {
    return firebaseService.deleteDocument(path);
  },

  async addDocument<T extends WithFieldValue<DocumentData>>(path: string, data: T) {
    return firebaseService.addDocument(path, data);
  },

  createQuery(path: string, constraints: any[] = []) {
    return firebaseService.createQuery(path, constraints);
  },

  async getQuerySnapshot(query: any) {
    return firebaseService.getQuerySnapshot(query);
  },

  onDocumentSnapshot<T extends DocumentData>(path: string, callback: (data: T | null) => void) {
    return firebaseService.onDocumentSnapshot(path, callback);
  },

  onCollectionSnapshot<T extends DocumentData>(path: string, callback: (data: (T & { id: string })[]) => void) {
    return firebaseService.onCollectionSnapshot(path, callback);
  },

  // 查詢輔助函數
  where(field: string, opStr: string, value: any) {
    return where(field, opStr as any, value);
  },

  orderBy(field: string, directionStr?: 'asc' | 'desc') {
    return orderBy(field, directionStr);
  },

  limit(n: number) {
    return limit(n);
  },

  startAt(...fieldValues: any[]) {
    return startAt(...fieldValues);
  },

  startAfter(...fieldValues: any[]) {
    return startAfter(...fieldValues);
  },

  endAt(...fieldValues: any[]) {
    return endAt(...fieldValues);
  },

  endBefore(...fieldValues: any[]) {
    return endBefore(...fieldValues);
  },

  // 數據轉換輔助函數
  timestamp() {
    return serverTimestamp();
  },

  increment(n: number) {
    return increment(n);
  },

  arrayUnion(...elements: any[]) {
    return arrayUnion(...elements);
  },

  arrayRemove(...elements: any[]) {
    return arrayRemove(...elements);
  }
}; 