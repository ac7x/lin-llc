// 動態載入 reCAPTCHA v3 script 的 util function
// 只會載入一次，重複呼叫安全

export function loadRecaptchaScript(siteKey?: string): Promise<void> {
    const key = siteKey || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!key) return Promise.reject(new Error('reCAPTCHA site key 未設定，請檢查環境變數 NEXT_PUBLIC_RECAPTCHA_SITE_KEY'));
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') return reject(new Error('Not in browser environment'));
        if (document.getElementById('recaptcha-v3-script')) {
            // 已經載入過，直接 resolve
            if (typeof grecaptcha !== 'undefined') {
                resolve();
            } else {
                // script 還在載入中，監聽 onload
                document.getElementById('recaptcha-v3-script')!.addEventListener('load', () => resolve());
            }
            return;
        }
        const script = document.createElement('script');
        script.id = 'recaptcha-v3-script';
        script.src = `https://www.google.com/recaptcha/enterprise.js?render=${key}`;
        script.async = true;
        script.onload = () => {
            resolve();
        };
        script.onerror = () => {
            reject(new Error('reCAPTCHA v3 script 載入失敗，請檢查你的網站金鑰或網路連線。'));
        };
        document.body.appendChild(script);
    });
}
