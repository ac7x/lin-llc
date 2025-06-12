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
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Query,
  QueryConstraint
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

  createQuery<T extends DocumentData>(path: string, constraints: QueryConstraint[] = []) {
    return firebaseService.createQuery<T>(path, constraints);
  },

  async getQuerySnapshot<T extends DocumentData>(query: Query<T>) {
    return firebaseService.getQuerySnapshot(query);
  },

  onDocumentSnapshot<T extends DocumentData>(path: string, callback: (data: T | null) => void) {
    return firebaseService.onDocumentSnapshot(path, callback);
  },

  onCollectionSnapshot<T extends DocumentData>(query: Query<T>, callback: (data: (T & { id: string })[]) => void) {
    return firebaseService.onCollectionSnapshot(query, callback);
  },

  // 查詢輔助函數
  where(field: string, opStr: '==' | '!=' | '>' | '>=' | '<' | '<=', value: unknown) {
    return where(field, opStr, value);
  },

  orderBy(field: string, directionStr?: 'asc' | 'desc') {
    return orderBy(field, directionStr);
  },

  limit(n: number) {
    return limit(n);
  },

  startAt(...fieldValues: unknown[]) {
    return startAt(...fieldValues);
  },

  startAfter(...fieldValues: unknown[]) {
    return startAfter(...fieldValues);
  },

  endAt(...fieldValues: unknown[]) {
    return endAt(...fieldValues);
  },

  endBefore(...fieldValues: unknown[]) {
    return endBefore(...fieldValues);
  },

  // 數據轉換輔助函數
  timestamp() {
    return serverTimestamp();
  },

  increment(n: number) {
    return increment(n);
  },

  arrayUnion(...elements: unknown[]) {
    return arrayUnion(...elements);
  },

  arrayRemove(...elements: unknown[]) {
    return arrayRemove(...elements);
  }
}; 