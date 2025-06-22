'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { APP_CHECK_CONFIG } from '@/lib/firebase-config';
import { initializeAppCheck, ReCaptchaV3Provider as FirebaseReCaptchaV3Provider } from 'firebase/app-check';
import { getApp } from 'firebase/app';

export function ReCaptchaV3Provider() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const app = getApp();
    initializeAppCheck(app, {
      provider: new FirebaseReCaptchaV3Provider(APP_CHECK_CONFIG.SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  }, []);

  if (!isClient) return null;

  return (
    <Script
      src={`https://www.google.com/recaptcha/api.js?render=6LepxlYrAAAAAMxGh5307zIOJHz1PKrVDgZHgKwg`}
      strategy='beforeInteractive'
    />
  );
}
