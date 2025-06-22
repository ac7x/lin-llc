import { signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase-client';
import { safeAsync, retry, getErrorMessage, logError } from '@/utils/errorUtils';

export interface SignInResult {
  success: boolean;
  user?: {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
  };
  error?: string;
}

export class SignInService {
  static async signInWithGoogle(): Promise<SignInResult> {
    const result = await safeAsync(async (): Promise<SignInResult> => {
      const provider = new GoogleAuthProvider();
      const result = await retry(() => signInWithPopup(auth, provider), 3, 1000);
      
      // 檢查用戶是否已存在於 members 集合
      const memberRef = doc(db, 'members', result.user.uid);
      const memberDoc = await retry(() => getDoc(memberRef), 3, 1000);
      
      if (!memberDoc.exists()) {
        // 新用戶，建立基本資料
        const memberData = {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          currentRole: 'guest',
          rolePermissions: {},
        };
        await retry(() => setDoc(memberRef, memberData), 3, 1000);
      } else {
        // 更新最後登入時間
        await retry(() => setDoc(
          memberRef,
          { lastLoginAt: new Date().toISOString() },
          { merge: true }
        ), 3, 1000);
      }
      
      return {
        success: true,
        user: {
          uid: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || '',
          photoURL: result.user.photoURL || undefined,
        },
      };
    }, (error) => {
      const message = `Google 登入失敗: ${getErrorMessage(error)}`;
      logError(error, { operation: 'google_signin' });
      return {
        success: false,
        error: message,
      };
    });

    // 確保返回正確的型別，如果 safeAsync 返回 null，則返回錯誤結果
    return result || {
      success: false,
      error: '登入過程中發生未知錯誤',
    };
  }

  static async signOut(): Promise<void> {
    const result = await safeAsync(async () => {
      await retry(() => signOut(auth), 3, 1000);
    }, (error) => {
      const message = `登出失敗: ${getErrorMessage(error)}`;
      logError(error, { operation: 'sign_out' });
      throw new Error(message);
    });

    // 如果 safeAsync 返回 null，表示發生錯誤，但錯誤已經在 errorHandler 中處理
    if (result === null) {
      throw new Error('登出過程中發生未知錯誤');
    }
  }

  static async checkUserExists(userId: string): Promise<boolean> {
    const result = await safeAsync(async (): Promise<boolean> => {
      const memberRef = doc(db, 'members', userId);
      const memberDoc = await retry(() => getDoc(memberRef), 3, 1000);
      return memberDoc.exists();
    }, (error) => {
      logError(error, { operation: 'check_user_exists', userId });
      return false;
    });

    // 確保返回正確的型別，如果 safeAsync 返回 null，則返回 false
    return result ?? false;
  }
}
