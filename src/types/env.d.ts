/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY: string;
    GOOGLE_RECAPTCHA_SECRET_KEY: string;
  }
}