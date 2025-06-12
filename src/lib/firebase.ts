import { initializeApp, getApps, getApp } from "firebase/app";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

const firebaseConfig = {
  // 請替換為您的 Firebase 配置
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// 檢查是否已經初始化過 Firebase
const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 初始化 Gemini API 服務
export const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });

// 創建 Gemini 模型實例
export const model = getGenerativeModel(ai, { model: "gemini-2.0-flash" }); 