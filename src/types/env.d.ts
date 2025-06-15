/**
 * 環境變數型別定義
 * 定義專案中使用的環境變數型別
 * 包含 reCAPTCHA、Firebase 模擬器等相關設定
 */

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: string;
    RECAPTCHA_SECRET_KEY: string;
    NEXT_PUBLIC_USE_FIREBASE_EMULATOR?: string;
    // ... 其他環境變數
  }
}