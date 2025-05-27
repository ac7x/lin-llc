// src/modules/shared/infrastructure/persistence/firebase/firebase-client.ts
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, signInWithRedirect, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCUDU4n6SvAQBT8qb1R0E_oWvSeJxYu-ro",
  authDomain: "lin-llc.firebaseapp.com",
  projectId: "lin-llc",
  storageBucket: "lin-llc.firebasestorage.app",
  messagingSenderId: "394023041902",
  appId: "1:394023041902:web:f9874be5d0d192557b1f7f",
  measurementId: "G-62JEHK00G8"
};

// SSR/多次初始化防呆
export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Google 登入
export const signInWithGooglePopup = () => signInWithPopup(auth, googleProvider);
export const signInWithGoogleRedirect = () => signInWithRedirect(auth, googleProvider);

// 登出
export const logout = () => signOut(auth);

export async function saveUserToFirestore(user: {
  uid: string;
  email?: string | null;
  emailVerified?: boolean;
  displayName?: string | null;
  photoURL?: string | null;
}) {
  if (!user?.uid) return;
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email || '',
    emailVerified: user.emailVerified ?? false,
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    updatedAt: new Date(),
  }, { merge: true });
}

export async function updateUserRole(uid: string, role: string) {
  if (!uid || !role) return;
  await setDoc(doc(db, 'users', uid), { role }, { merge: true });
}

export async function getUsersList() {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    return querySnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting users:', error);
    throw new Error('無法取得用戶列表');
  }
}

export async function deleteUserFromFirestore(uid: string) {
  try {
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('刪除用戶失敗');
  }
}

// 新增：建立虛擬用戶
export async function createVirtualUser({
    displayName,
    role,
}: {
    displayName: string;
    role: string;
}) {
    // 產生 28 字元隨機 UID
    function generateUid(length = 28) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let uid = '';
        for (let i = 0; i < length; i++) {
            uid += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return uid;
    }
    const uid = generateUid();
    const now = new Date();
    const userData = {
        uid,
        displayName,
        role,
        email: '', // 修正: 不存 undefined
        emailVerified: false,
        photoURL: '', // 修正: 不存 undefined
        updatedAt: now,
        metadata: {
            creationTime: now.toISOString(),
            lastSignInTime: now.toISOString(),
        },
        disabled: false,
    };

    // 直接使用上方已初始化的 db
    await setDoc(doc(db, 'users', uid), userData);

    return userData;
}