/**
 * Firebase 應用程式配置檔案
 * 定義 Firebase 專案的基本設定和常數
 * 包含 API 金鑰、專案 ID、集合名稱等配置
 * 管理 reCAPTCHA 和 App Check 相關設定
 */

// Firebase 應用程式配置
export const firebaseConfig = {
  apiKey: 'AIzaSyCUDU4n6SvAQBT8qb1R0E_oWvSeJxYu-ro',
  authDomain: 'lin-llc.firebaseapp.com',
  projectId: 'lin-llc',
  storageBucket: 'lin-llc.firebasestorage.app',
  messagingSenderId: '394023041902',
  appId: '1:394023041902:web:f9874be5d0d192557b1f7f',
  measurementId: 'G-62JEHK00G8',
};

// reCAPTCHA 相關配置
export const RECAPTCHA_CONFIG = {
  SITE_KEY: '6LepxlYrAAAAAMxGh5307zIOJHz1PKrVDgZHgKwg',
  SECRET_KEY: '6LepxlYrAAAAABPi52vTvGsVP4BpZh4UPPu_WNLQ',
} as const;

// App Check 配置
export const APP_CHECK_CONFIG = {
  SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LepxlYrAAAAAMxGh5307zIOJHz1PKrVDgZHgKwg',
};

// Google Maps API 金鑰，用於地圖服務的存取
export const GOOGLE_MAPS_API_KEY = 'AIzaSyBdgNEAkXT0pCWOkSK7xXoAcUsOWbJEz8o';
