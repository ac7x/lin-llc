import { useState, useEffect, useCallback } from 'react';

interface UseRecaptchaReturn {
    token: string | null;
    status: 'idle' | 'loading' | 'success' | 'error';
    refreshToken: () => Promise<void>;
    error: Error | null;
}

export function useRecaptcha(action: string = 'app_check'): UseRecaptchaReturn {
    const [token, setToken] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<Error | null>(null);

    const executeRecaptcha = useCallback(async () => {
        if (!window.grecaptcha) {
            setError(new Error('reCAPTCHA not loaded'));
            setStatus('error');
            return;
        }

        try {
            setStatus('loading');
            const newToken = await window.grecaptcha.execute(
                process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY!,
                { action }
            );
            setToken(newToken);
            setStatus('success');
            setError(null);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to execute reCAPTCHA');
            setError(error);
            setStatus('error');
            console.error('reCAPTCHA execution failed:', error);
        }
    }, [action]);

    // 初始化和定期更新令牌
    useEffect(() => {
        executeRecaptcha();

        // 每 2 分鐘更新一次令牌
        const interval = setInterval(executeRecaptcha, 2 * 60 * 1000);

        return () => clearInterval(interval);
    }, [executeRecaptcha]);

    return {
        token,
        status,
        refreshToken: executeRecaptcha,
        error
    };
} 