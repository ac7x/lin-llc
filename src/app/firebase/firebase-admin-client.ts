import admin from 'firebase-admin';

/**
 * Firebase Admin 客戶端（單例）
 * 初始化 Firebase Admin SDK 並提供 Firestore 操作
 */
export class FirebaseAdminClient {
  private static instance: FirebaseAdminClient;
  private firestore: admin.firestore.Firestore;

  private constructor() {
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    this.firestore = admin.firestore();
  }

  /**
   * 取得單例實例
   */
  static getInstance(): FirebaseAdminClient {
    return this.instance ?? (this.instance = new FirebaseAdminClient());
  }

  /**
   * 取得 Firestore 實例
   */
  getFirestore(): admin.firestore.Firestore {
    return this.firestore;
  }
}

export const firebaseAdminClient = FirebaseAdminClient.getInstance();
export const firestoreAdmin = firebaseAdminClient.getFirestore();