declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY: string;
    // ... 其他環境變數
  }
}

interface Window {
  grecaptcha: {
    execute: (siteKey: string, options: { action: string }) => Promise<string>;
  };
}