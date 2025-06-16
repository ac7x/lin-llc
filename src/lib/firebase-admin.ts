/**
 * Firebase Admin SDK 設定
 * 提供後端服務所需的 Firebase 功能
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

// Firebase Admin 設定
const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
};

// 初始化 Firebase Admin
const adminApp = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0];
const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);
const adminMessaging: Messaging = getMessaging(adminApp);

// 驗證 Firebase Admin 設定
if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
  throw new Error('缺少 FIREBASE_ADMIN_PROJECT_ID 環境變數');
}

if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
  throw new Error('缺少 FIREBASE_ADMIN_CLIENT_EMAIL 環境變數');
}

if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
  throw new Error('缺少 FIREBASE_ADMIN_PRIVATE_KEY 環境變數');
}

export { adminApp, adminAuth, adminDb, adminMessaging }; 