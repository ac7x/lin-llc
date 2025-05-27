import { initializeApp, FirebaseApp } from 'firebase/app';
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
  Timestamp
} from 'firebase/firestore';
import { 
  getStorage, 
  Storage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  StorageReference
} from 'firebase/storage';
import { 
  getAnalytics, 
  Analytics,
  logEvent
} from 'firebase/analytics';

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
  private storage: Storage;
  private analytics: Analytics;

  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    this.storage = getStorage(this.app);
    this.analytics = getAnalytics(this.app);
  }

  // ==================== 認證功能 ====================
  
  /**
   * 使用電子郵件和密碼登入
   */
  async signInWithEmail(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 使用電子郵件和密碼註冊
   */
  async signUpWithEmail(email: string, password: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 使用 Google 登入
   */
  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      return { success: true, user: result.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 登出
   */
  async signOut() {
    try {
      await signOut(this.auth);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 發送密碼重置郵件
   */
  async sendPasswordReset(email: string) {
    try {
      await sendPasswordResetEmail(this.auth, email);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 更新用戶資料
   */
  async updateUserProfile(displayName?: string, photoURL?: string) {
    try {
      if (this.auth.currentUser) {
        await updateProfile(this.auth.currentUser, { displayName, photoURL });
        return { success: true };
      }
      return { success: false, error: 'No user signed in' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 監聽認證狀態變化
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(this.auth, callback);
  }

  /**
   * 獲取當前用戶
   */
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  // ==================== Firestore 功能 ====================

  /**
   * 新增文檔
   */
  async addDocument(collectionName: string, data: DocumentData) {
    try {
      const docRef = await addDoc(collection(this.db, collectionName), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return { success: true, id: docRef.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 設置文檔（指定 ID）
   */
  async setDocument(collectionName: string, docId: string, data: DocumentData, merge = true) {
    try {
      await setDoc(doc(this.db, collectionName, docId), {
        ...data,
        updatedAt: Timestamp.now()
      }, { merge });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 獲取單個文檔
   */
  async getDocument(collectionName: string, docId: string) {
    try {
      const docSnap = await getDoc(doc(this.db, collectionName, docId));
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      } else {
        return { success: false, error: 'Document not found' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 獲取集合中的所有文檔
   */
  async getCollection(collectionName: string, constraints?: QueryConstraint[]) {
    try {
      let q = collection(this.db, collectionName);
      
      if (constraints && constraints.length > 0) {
        q = query(q, ...constraints) as any;
      }

      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, data: docs };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 更新文檔
   */
  async updateDocument(collectionName: string, docId: string, data: Partial<DocumentData>) {
    try {
      await updateDoc(doc(this.db, collectionName, docId), {
        ...data,
        updatedAt: Timestamp.now()
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 刪除文檔
   */
  async deleteDocument(collectionName: string, docId: string) {
    try {
      await deleteDoc(doc(this.db, collectionName, docId));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 實時監聽文檔變化
   */
  subscribeToDocument(collectionName: string, docId: string, callback: (data: any) => void) {
    return onSnapshot(doc(this.db, collectionName, docId), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      } else {
        callback(null);
      }
    });
  }

  /**
   * 實時監聽集合變化
   */
  subscribeToCollection(collectionName: string, callback: (data: any[]) => void, constraints?: QueryConstraint[]) {
    let q = collection(this.db, collectionName);
    
    if (constraints && constraints.length > 0) {
      q = query(q, ...constraints) as any;
    }

    return onSnapshot(q, (querySnapshot) => {
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(docs);
    });
  }

  // ==================== Storage 功能 ====================

  /**
   * 上傳檔案
   */
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
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 上傳檔案（帶進度）
   */
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
        onError?.(error.message);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onComplete?.(downloadURL);
        } catch (error: any) {
          onError?.(error.message);
        }
      }
    );

    return uploadTask;
  }

  /**
   * 獲取檔案下載 URL
   */
  async getFileURL(path: string) {
    try {
      const storageRef = ref(this.storage, path);
      const url = await getDownloadURL(storageRef);
      return { success: true, url };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 刪除檔案
   */
  async deleteFile(path: string) {
    try {
      const storageRef = ref(this.storage, path);
      await deleteObject(storageRef);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==================== Analytics 功能 ====================

  /**
   * 記錄自定義事件
   */
  logAnalyticsEvent(eventName: string, parameters?: { [key: string]: any }) {
    try {
      logEvent(this.analytics, eventName, parameters);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ==================== 輔助方法 ====================

  /**
   * 創建查詢條件
   */
  createQueryConstraints(conditions: {
    where?: { field: string; operator: any; value: any }[];
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

  /**
   * 獲取 Firebase 實例
   */
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