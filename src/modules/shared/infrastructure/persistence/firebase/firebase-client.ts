import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore,
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  DocumentData,
  onSnapshot,
  Timestamp,
  Query,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { 
  getStorage, 
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { 
  getAnalytics, 
  Analytics,
  logEvent
} from 'firebase/analytics';

// Firestore where 運算子型別定義
type FirestoreWhereFilterOp =
  '<' | '<=' | '==' | '!=' | '>=' | '>' |
  'array-contains' | 'in' | 'not-in' | 'array-contains-any';

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyCUDU4n6SvAQBT8qb1R0E_oWvSeJxYu-ro",
  authDomain: "lin-llc.firebaseapp.com",
  projectId: "lin-llc",
  storageBucket: "lin-llc.firebasestorage.app",
  messagingSenderId: "394023041902",
  appId: "1:394023041902:web:f9874be5d0d192557b1f7f",
  measurementId: "G-62JEHK00G8"
};

class FirebaseClient {
  private app: FirebaseApp;
  private auth: Auth;
  private db: Firestore;
  private storage: ReturnType<typeof getStorage>;
  private analytics: Analytics;

  constructor() {
    // 只初始化一次
    if (getApps().length === 0) {
      this.app = initializeApp(firebaseConfig);
    } else {
      this.app = getApps()[0];
    }
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    this.storage = getStorage(this.app);
    this.analytics = getAnalytics(this.app);
  }

  // ==================== 認證功能 ====================
  
  async signInWithEmail(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async signUpWithEmail(email: string, password: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async signOut() {
    try {
      await signOut(this.auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async sendPasswordReset(email: string) {
    try {
      await sendPasswordResetEmail(this.auth, email);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async updateUserProfile(displayName?: string, photoURL?: string) {
    try {
      if (this.auth.currentUser) {
        await updateProfile(this.auth.currentUser, { displayName, photoURL });
        return { success: true };
      }
      return { success: false, error: 'No user signed in' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(this.auth, callback);
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  // ==================== Firestore 功能 ====================

  async addDocument(collectionName: string, data: DocumentData) {
    try {
      const docRef = await addDoc(collection(this.db, collectionName), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async setDocument(collectionName: string, docId: string, data: DocumentData, merge = true) {
    try {
      await setDoc(doc(this.db, collectionName, docId), {
        ...data,
        updatedAt: Timestamp.now()
      }, { merge });
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getDocument(collectionName: string, docId: string) {
    try {
      const docSnap: DocumentSnapshot<DocumentData> = await getDoc(doc(this.db, collectionName, docId));
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      } else {
        return { success: false, error: 'Document not found' };
      }
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getCollection(collectionName: string, constraints?: QueryConstraint[]) {
    try {
      let q: Query<DocumentData> = collection(this.db, collectionName);

      if (constraints && constraints.length > 0) {
        q = query(q, ...constraints);
      }

      const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, data: docs };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async updateDocument(collectionName: string, docId: string, data: Partial<DocumentData>) {
    try {
      await updateDoc(doc(this.db, collectionName, docId), {
        ...data,
        updatedAt: Timestamp.now()
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async deleteDocument(collectionName: string, docId: string) {
    try {
      await deleteDoc(doc(this.db, collectionName, docId));
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  subscribeToDocument(
    collectionName: string,
    docId: string,
    callback: (data: { id: string; [key: string]: unknown } | null) => void
  ) {
    return onSnapshot(doc(this.db, collectionName, docId), (docSnap: DocumentSnapshot<DocumentData>) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() });
      } else {
        callback(null);
      }
    });
  }

  subscribeToCollection(
    collectionName: string,
    callback: (data: { id: string; [key: string]: unknown }[]) => void,
    constraints?: QueryConstraint[]
  ) {
    let q: Query<DocumentData> = collection(this.db, collectionName);
    if (constraints && constraints.length > 0) {
      q = query(q, ...constraints);
    }

    return onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(docs);
    });
  }

  // ==================== Storage 功能 ====================

  async uploadFile(path: string, file: File | Blob) {
    try {
      const storageRef = ref(this.storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return { 
        success: true, 
        downloadURL,
        ref: snapshot.ref,
        metadata: snapshot.metadata 
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  uploadFileWithProgress(
    path: string, 
    file: File | Blob,
    onProgress?: (progress: number) => void,
    onComplete?: (downloadURL: string) => void,
    onError?: (error: string) => void
  ) {
    const storageRef = ref(this.storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => {
        onError?.((error as Error).message);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onComplete?.(downloadURL);
        } catch (error) {
          onError?.((error as Error).message);
        }
      }
    );

    return uploadTask;
  }

  async getFileURL(path: string) {
    try {
      const storageRef = ref(this.storage, path);
      const url = await getDownloadURL(storageRef);
      return { success: true, url };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async deleteFile(path: string) {
    try {
      const storageRef = ref(this.storage, path);
      await deleteObject(storageRef);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // ==================== Analytics 功能 ====================

  logAnalyticsEvent(eventName: string, parameters?: { [key: string]: unknown }) {
    try {
      logEvent(this.analytics, eventName, parameters);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // ==================== 輔助方法 ====================

  createQueryConstraints(conditions: {
    where?: { field: string; operator: FirestoreWhereFilterOp; value: unknown }[];
    orderBy?: { field: string; direction?: 'asc' | 'desc' }[];
    limit?: number;
  }): QueryConstraint[] {
    const constraints: QueryConstraint[] = [];

    if (conditions.where) {
      conditions.where.forEach(({ field, operator, value }) => {
        constraints.push(where(field, operator, value));
      });
    }

    if (conditions.orderBy) {
      conditions.orderBy.forEach(({ field, direction = 'asc' }) => {
        constraints.push(orderBy(field, direction));
      });
    }

    if (conditions.limit) {
      constraints.push(limit(conditions.limit));
    }

    return constraints;
  }

  getFirebaseInstances() {
    return {
      app: this.app,
      auth: this.auth,
      db: this.db,
      storage: this.storage,
      analytics: this.analytics
    };
  }
}

// 創建並導出單例實例
export const firebaseClient = new FirebaseClient();

// 導出類型和常用方法
export type { User, DocumentData, QueryConstraint };
export { 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  GoogleAuthProvider 
};

export default firebaseClient;