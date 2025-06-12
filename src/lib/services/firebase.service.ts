import { FirebaseApp, initializeApp } from "firebase/app";
import { 
  Auth,
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  getRedirectResult,
  User,
  UserCredential
} from "firebase/auth";
import {
  Firestore,
  getFirestore,
  collection,
  doc,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAt,
  startAfter,
  endAt,
  endBefore,
  onSnapshot,
  writeBatch,
  runTransaction,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  DocumentData,
  WithFieldValue,
  Query,
  QueryConstraint,
  DocumentSnapshot,
  QuerySnapshot,
  WriteBatch,
  Transaction,
  DocumentReference
} from "firebase/firestore";
import { 
  AppCheck, 
  initializeAppCheck, 
  ReCaptchaV3Provider, 
  getToken 
} from 'firebase/app-check';
import { firebaseConfig, APP_CHECK_CONFIG } from '../firebase-config';

export class FirebaseService {
  private static instance: FirebaseService;
  private app: FirebaseApp;
  private auth: Auth;
  private db: Firestore;
  private appCheck: AppCheck | null = null;
  private authStateHandlers = new Set<(user: User | null) => void>();

  private constructor() {
    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    this.initializeAppCheck();
    this.setupAuthStateListener();
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  private async initializeAppCheck(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      this.appCheck = initializeAppCheck(this.app, {
        provider: new ReCaptchaV3Provider(APP_CHECK_CONFIG.SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (error) {
      console.error('App Check initialization failed:', error);
    }
  }

  private setupAuthStateListener(): void {
    onAuthStateChanged(this.auth, (user) => {
      this.authStateHandlers.forEach(handler => handler(user));
    });
  }

  // Auth 相關方法
  public getAuth(): Auth {
    return this.auth;
  }

  public async getAppCheckToken(): Promise<string | null> {
    if (!this.appCheck) return null;
    try {
      const tokenResult = await getToken(this.appCheck);
      return tokenResult.token;
    } catch {
      return null;
    }
  }

  public subscribeToAuthState(handler: (user: User | null) => void): () => void {
    this.authStateHandlers.add(handler);
    handler(this.auth.currentUser);
    return () => this.authStateHandlers.delete(handler);
  }

  // 認證方法
  public async signInWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    return signInWithRedirect(this.auth, provider);
  }

  public async signInWithEmail(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  public async createUserWithEmail(email: string, password: string): Promise<UserCredential> {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  public async signOut(): Promise<void> {
    return signOut(this.auth);
  }

  public async setPersistence(): Promise<void> {
    return setPersistence(this.auth, browserLocalPersistence);
  }

  public async getRedirectResult(): Promise<UserCredential | null> {
    return getRedirectResult(this.auth);
  }

  // Firestore 相關方法
  public getDb(): Firestore {
    return this.db;
  }

  public getCollection(path: string) {
    return collection(this.db, path);
  }

  public getDocument(path: string) {
    return doc(this.db, path);
  }

  public async getDocumentData<T extends DocumentData>(path: string): Promise<T | null> {
    const docRef = this.getDocument(path);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as T) : null;
  }

  public async setDocument<T extends WithFieldValue<DocumentData>>(path: string, data: T) {
    const docRef = this.getDocument(path);
    return setDoc(docRef, data);
  }

  public async updateDocument<T extends Partial<WithFieldValue<DocumentData>>>(path: string, data: T) {
    const docRef = this.getDocument(path);
    return updateDoc(docRef, data);
  }

  public async deleteDocument(path: string) {
    const docRef = this.getDocument(path);
    return deleteDoc(docRef);
  }

  public async addDocument<T extends WithFieldValue<DocumentData>>(path: string, data: T) {
    const collectionRef = this.getCollection(path);
    return addDoc(collectionRef, data);
  }

  // 查詢方法
  public createQuery<T extends DocumentData>(path: string, constraints: QueryConstraint[] = []): Query<T> {
    const collectionRef = this.getCollection(path);
    return query(collectionRef, ...constraints) as Query<T>;
  }

  public async getQuerySnapshot<T extends DocumentData>(query: Query<T>): Promise<QuerySnapshot<T>> {
    return getDocs(query);
  }

  // 查詢輔助方法
  public where(field: string, opStr: '==' | '!=' | '>' | '>=' | '<' | '<=', value: unknown) {
    return where(field, opStr, value);
  }

  public orderBy(field: string, directionStr?: 'asc' | 'desc') {
    return orderBy(field, directionStr);
  }

  public limit(n: number) {
    return limit(n);
  }

  public startAt(...fieldValues: unknown[]) {
    return startAt(...fieldValues);
  }

  public startAfter(...fieldValues: unknown[]) {
    return startAfter(...fieldValues);
  }

  public endAt(...fieldValues: unknown[]) {
    return endAt(...fieldValues);
  }

  public endBefore(...fieldValues: unknown[]) {
    return endBefore(...fieldValues);
  }

  // 批次操作
  public createBatch(): WriteBatch {
    return writeBatch(this.db);
  }

  public async runTransaction<T>(updateFunction: (transaction: Transaction) => Promise<T>): Promise<T> {
    return runTransaction(this.db, updateFunction);
  }

  // 資料轉換輔助方法
  public timestamp() {
    return serverTimestamp();
  }

  public increment(n: number) {
    return increment(n);
  }

  public arrayUnion(...elements: unknown[]) {
    return arrayUnion(...elements);
  }

  public arrayRemove(...elements: unknown[]) {
    return arrayRemove(...elements);
  }

  // 即時監聽
  public onDocumentSnapshot<T extends DocumentData>(path: string, callback: (data: T | null) => void) {
    const docRef = this.getDocument(path) as DocumentReference<T>;
    return onSnapshot(docRef, (doc: DocumentSnapshot<T>) => {
      callback(doc.exists() ? doc.data() : null);
    });
  }

  public onCollectionSnapshot<T extends DocumentData>(
    query: Query<T>,
    callback: (data: (T & { id: string })[]) => void
  ): () => void {
    return onSnapshot(query, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (T & { id: string })[];
      callback(data);
    });
  }
}

// 導出單例實例
export const firebaseService = FirebaseService.getInstance(); 