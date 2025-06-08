// Firebase 應用程式配置
export const firebaseConfig = {
  apiKey: "AIzaSyCUDU4n6SvAQBT8qb1R0E_oWvSeJxYu-ro",
  authDomain: "lin-llc.firebaseapp.com",
  projectId: "lin-llc",
  storageBucket: "lin-llc.appspot.com",
  messagingSenderId: "394023041902",
  appId: "1:394023041902:web:f9874be5d0d192557b1f7f",
  measurementId: "G-62JEHK00G8",
};

// Collection 名稱常數
export const COLLECTIONS = {
  NOTIFICATIONS: 'notifications',
  USERS: 'users',
} as const;

// reCAPTCHA 相關配置
export const RECAPTCHA_CONFIG = {
  SITE_KEY: process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY,
  SECRET_KEY: process.env.GOOGLE_RECAPTCHA_SECRET_KEY,
} as const;

// Firebase Emulator 配置
export const FIREBASE_EMULATOR = {
  ENABLED: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true',
} as const;
