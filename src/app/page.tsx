"use client";

import React, { useState } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { firebaseApp } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';

const HomePage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    const auth = getAuth(firebaseApp);
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      setUser(userCredential.user);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (user) {
    return (
      <div className="p-6 max-w-lg mx-auto space-y-4">
        <h1 className="text-2xl font-bold">歡迎, {user.displayName || user.email}</h1>
        <p className="text-base">您已使用 Google 帳號登入。</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Google 帳號登入</h1>
      <button
        className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
        onClick={handleGoogleLogin}
        type="button"
      >
        使用 Google 帳號登入
      </button>
      {error && <div className="text-red-500">{error}</div>}
    </div>
  );
};

export default HomePage;