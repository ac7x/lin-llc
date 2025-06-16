/**
 * Firebase Admin SDK 設定
 * 提供後端服務所需的 Firebase 功能
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

// 初始化 Firebase Admin
const adminApp = getApps().length === 0 ? initializeApp() : getApps()[0];
const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);
const adminMessaging: Messaging = getMessaging(adminApp);

export { adminApp, adminAuth, adminDb, adminMessaging }; 