// src/app/page.tsx
"use client";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, signInWithGooglePopup, signInWithGoogleRedirect, saveUserToFirestore, db } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

const RECAPTCHA_SITE_KEY = "6Leykk4rAAAAAE8l-TYIU-N42B4fkl4bBBVWYibE";

let isAppCheckInitialized = false;

const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
};

export default function HomePage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [appCheckError, setAppCheckError] = useState("");

  useEffect(() => {
    // 動態載入 reCAPTCHA v3 script
    if (typeof window === 'undefined') return;
    if (document.getElementById('recaptcha-v3-script')) return;
    const script = document.createElement('script');
    script.id = 'recaptcha-v3-script';
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.onload = () => {
      // reCAPTCHA script loaded
    };
    script.onerror = () => {
      setAppCheckError('reCAPTCHA v3 script 載入失敗，請檢查你的網站金鑰或網路連線。');
    };
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const initAppCheck = async () => {
      if (isAppCheckInitialized || typeof window === 'undefined' || !auth.app) return;
      // 等待 grecaptcha 載入
      if (typeof grecaptcha === 'undefined') {
        const script = document.getElementById('recaptcha-v3-script');
        if (script) {
          script.addEventListener('load', initAppCheck, { once: true });
          return;
        }
        setAppCheckError('reCAPTCHA v3 script 載入失敗，請檢查你的網站金鑰或網路連線。');
        return;
      }
      try {
        initializeAppCheck(auth.app, {
          provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY),
          isTokenAutoRefreshEnabled: true
        });
        isAppCheckInitialized = true;
        setAppCheckError("");
      } catch (err) {
        if (err instanceof Error) {
          setAppCheckError(`App Check 初始化失敗: ${err.message}`);
        } else {
          setAppCheckError('App Check 初始化失敗: 未知錯誤');
        }
      }
    };
    initAppCheck();
  }, []);

  useEffect(() => {
    const redirectByRole = async () => {
      if (user) {
        await saveUserToFirestore(user); // 寫入 Firestore users 集合
        // 取得 Firestore 中的 user 資料
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const role = userData.role || 'user';
        // 根據角色跳轉
        if (role === 'owner') {
          router.push('/owner');
        } else if (role === 'finance') {
          router.push('/finance');
        } else if (role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/user/profile');
        }
      }
    };
    redirectByRole();
  }, [user, router]);

  const handleGoogleLogin = async () => {
    try {
      if (isMobile()) {
        await signInWithGoogleRedirect();
      } else {
        await signInWithGooglePopup();
      }
    } catch {
      alert('登入失敗');
    }
  };

  if (loading) return <div className="p-6 text-center">載入中...</div>;
  if (user) return <div className="p-6 text-center">重定向中...</div>;

  return (
    <div className="p-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Google 帳號登入</h1>
      <button
        className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
        onClick={handleGoogleLogin}
      >
        使用 Google 帳號登入
      </button>
      {appCheckError && <div className="text-red-600 text-sm mt-2">{appCheckError}</div>}
    </div>
  );
}