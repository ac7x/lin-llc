"use server";

import * as admin from 'firebase-admin';
import { adminAuth, adminAppCheck } from '../utils/firebaseAdmin';
import { UserRole, hasRequiredRole } from '../types/roles';
import { initializeServerApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';

// Firebase 配置
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 用戶資料介面
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  department?: string;
  position?: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  permissions?: string[];
}

// 驗證請求
async function verifyRequest(appCheckToken: string, idToken: string): Promise<{
  uid: string;
  role: UserRole;
  decodedToken: admin.auth.DecodedIdToken;
}> {
  if (!appCheckToken) throw new Error("App Check token missing.");
  if (!idToken) throw new Error("ID token missing.");
  
  try {
    await adminAppCheck.verifyToken(appCheckToken);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const role = (decodedToken.role as UserRole) || UserRole.GUEST;
    return { uid: decodedToken.uid, role, decodedToken };
  } catch (error) {
    console.error("Verification failed:", error);
    throw new Error("Invalid credentials. Access denied.");
  }
}

// 獲取用戶資料
export async function getUserProfile(
  targetUid: string,
  appCheckToken: string,
  idToken: string
) {
  try {
    const { role: callerRole } = await verifyRequest(appCheckToken, idToken);
    
    // 檢查權限：用戶只能查看自己的資料，或 MANAGER 以上可以查看所有用戶
    if (targetUid !== (await verifyRequest(appCheckToken, idToken)).uid && 
        !hasRequiredRole(callerRole, UserRole.MANAGER)) {
      throw new Error("Permission denied: Cannot view other user profiles.");
    }

    const serverApp = initializeServerApp(firebaseConfig, {
      appCheckToken,
      authIdToken: idToken,
    });
    const db = getFirestore(serverApp);
    
    const userDoc = await getDoc(doc(db, 'users', targetUid));
    
    if (!userDoc.exists()) {
      return { status: 'error', message: 'User profile not found.' };
    }
    
    const data = userDoc.data();
    return {
      status: 'success',
      profile: {
        uid: targetUid,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL,
        role: data.role,
        department: data.department,
        position: data.position,
        phoneNumber: data.phoneNumber,
        isActive: data.isActive ?? true,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        lastLoginAt: data.lastLoginAt?.toDate(),
        permissions: data.permissions,
      } as UserProfile
    };
  } catch (error: any) {
    console.error("Error in getUserProfile:", error.message);
    return { status: 'error', message: error.message };
  }
}

// 更新用戶資料
export async function updateUserProfile(
  targetUid: string,
  updates: Partial<UserProfile>,
  appCheckToken: string,
  idToken: string
) {
  try {
    const { uid: callerUid, role: callerRole } = await verifyRequest(appCheckToken, idToken);
    
    // 檢查權限：用戶只能更新自己的資料，或 ADMIN 以上可以更新所有用戶
    if (targetUid !== callerUid && !hasRequiredRole(callerRole, UserRole.ADMIN)) {
      throw new Error("Permission denied: Cannot update other user profiles.");
    }

    const serverApp = initializeServerApp(firebaseConfig, {
      appCheckToken,
      authIdToken: idToken,
    });
    const db = getFirestore(serverApp);
    
    // 準備更新資料
    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    };
    
    // 移除不應該更新的欄位
    delete updateData.uid;
    delete updateData.createdAt;
    
    // 如果更新角色，同時更新 Firebase Auth 的自訂聲明
    if (updates.role && hasRequiredRole(callerRole, UserRole.ADMIN)) {
      await adminAuth.setCustomUserClaims(targetUid, { role: updates.role });
      await adminAuth.revokeRefreshTokens(targetUid);
    }
    
    await updateDoc(doc(db, 'users', targetUid), updateData);
    
    return { status: 'success', message: 'User profile updated successfully.' };
  } catch (error: any) {
    console.error("Error in updateUserProfile:", error.message);
    return { status: 'error', message: error.message };
  }
}

// 獲取所有用戶列表
export async function getAllUsers(appCheckToken: string, idToken: string) {
  try {
    const { role: callerRole } = await verifyRequest(appCheckToken, idToken);
    
    if (!hasRequiredRole(callerRole, UserRole.MANAGER)) {
      throw new Error("Permission denied: Only MANAGER or higher can view all users.");
    }

    const serverApp = initializeServerApp(firebaseConfig, {
      appCheckToken,
      authIdToken: idToken,
    });
    const db = getFirestore(serverApp);
    
    const usersQuery = query(collection(db, 'users'), where('isActive', '==', true));
    const usersSnapshot = await getDocs(usersQuery);
    
    const users: UserProfile[] = [];
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        uid: doc.id,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL,
        role: data.role,
        department: data.department,
        position: data.position,
        phoneNumber: data.phoneNumber,
        isActive: data.isActive ?? true,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        lastLoginAt: data.lastLoginAt?.toDate(),
        permissions: data.permissions,
      } as UserProfile);
    });
    
    return { status: 'success', users };
  } catch (error: any) {
    console.error("Error in getAllUsers:", error.message);
    return { status: 'error', message: error.message };
  }
}

// 創建或同步用戶資料
export async function syncUserProfile(
  userData: {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
  },
  appCheckToken: string,
  idToken: string
) {
  try {
    const { uid: callerUid } = await verifyRequest(appCheckToken, idToken);
    
    // 只能同步自己的資料
    if (userData.uid !== callerUid) {
      throw new Error("Permission denied: Can only sync own profile.");
    }

    const serverApp = initializeServerApp(firebaseConfig, {
      appCheckToken,
      authIdToken: idToken,
    });
    const db = getFirestore(serverApp);
    
    const userRef = doc(db, 'users', userData.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // 創建新用戶資料
      await setDoc(userRef, {
        ...userData,
        role: UserRole.USER,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      });
    } else {
      // 更新現有用戶資料
      await updateDoc(userRef, {
        ...userData,
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      });
    }
    
    return { status: 'success', message: 'User profile synced successfully.' };
  } catch (error: any) {
    console.error("Error in syncUserProfile:", error.message);
    return { status: 'error', message: error.message };
  }
} 