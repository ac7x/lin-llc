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
  User
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
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  DocumentData,
  WithFieldValue
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
    return updateDoc(docRef, data as any);
  }

  public async deleteDocument(path: string) {
    const docRef = this.getDocument(path);
    return deleteDoc(docRef);
  }

  public async addDocument<T extends WithFieldValue<DocumentData>>(path: string, data: T) {
    const collectionRef = this.getCollection(path);
    return addDoc(collectionRef, data);
  }

  public createQuery(path: string, constraints: any[] = []) {
    const collectionRef = this.getCollection(path);
    return query(collectionRef, ...constraints);
  }

  public async getQuerySnapshot(query: any) {
    return getDocs(query);
  }

  public onDocumentSnapshot(path: string, callback: (data: any) => void) {
    const docRef = this.getDocument(path);
    return onSnapshot(docRef, (doc) => {
      callback(doc.exists() ? doc.data() : null);
    });
  }

  public onCollectionSnapshot(path: string, callback: (data: any[]) => void) {
    const collectionRef = this.getCollection(path);
    return onSnapshot(collectionRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(data);
    });
  }
}

// 導出單例實例
export const firebaseService = FirebaseService.getInstance(); 