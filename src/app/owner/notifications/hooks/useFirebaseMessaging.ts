import { useEffect, useState } from 'react';
import { initializeMessaging, setupOnMessageListener } from '@/lib/firebase/firebase-messaging';

export function useFirebaseMessaging(): { fcmToken: string | null; error: string | null } {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initMessaging = async () => {
      try {
        const token = await initializeMessaging();
        setFcmToken(token);
        setupOnMessageListener();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize messaging');
      }
    };

    initMessaging();
  }, []);

  return { fcmToken, error };
}