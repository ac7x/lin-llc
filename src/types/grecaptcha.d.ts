interface Window {
    grecaptcha: Grecaptcha;
  }
  
  declare interface Grecaptcha {
    ready: (cb: () => void) => void;
    execute: (secret: string, config: { action: string }) => Promise<string>;
  }
  
  declare const grecaptcha: Grecaptcha;