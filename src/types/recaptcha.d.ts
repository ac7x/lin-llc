// src/types/recaptcha.d.ts 或 global.d.ts
declare var grecaptcha: {
    execute: (siteKey: string, options?: { action: string }) => Promise<string>;
    ready: (callback: () => void) => void;
};
