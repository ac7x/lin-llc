// src/types/recaptcha.d.ts 或 global.d.ts
declare const grecaptcha: {
    execute: (siteKey: string, options?: { action: string }) => Promise<string>;
    ready: (callback: () => void) => void;
};
