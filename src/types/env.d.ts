declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: string;
    RECAPTCHA_SECRET_KEY: string;
    NEXT_PUBLIC_USE_FIREBASE_EMULATOR?: string;
    // ... 其他環境變數
  }
}