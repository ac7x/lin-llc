"use client";

import { GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";
import { useState } from "react";
import { auth } from "@/lib/firebase/firebase-client";

export default function SignIn() {
  const [user, setUser] = useState<User | null>(null);

  async function handleGoogleSignIn() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleSignOut() {
    await signOut(auth);
    setUser(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      {user && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          {user.photoURL && (
            <img src={user.photoURL} alt="User Avatar" width={80} height={80} style={{ borderRadius: "50%", marginBottom: 8 }} />
          )}
          <strong>{user.displayName}</strong>
          <small>{user.email}</small>
        </div>
      )}
      {user ? (
        <button onClick={handleSignOut}>Sign Out</button>
      ) : (
        <button onClick={handleGoogleSignIn}>Sign in with Google</button>
      )}
    </div>
  );
}