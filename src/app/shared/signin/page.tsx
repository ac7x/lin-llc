"use client";

import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useFirebase } from "@/lib/firebase-context"; // ✅ 使用正確的 context 路徑
import { auth, db } from "@/lib/firebase-client";
import Image from "next/image";

export default function SignIn() {
  const { user, loading } = useFirebase();

  async function handleGoogleSignIn() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const signedInUser = result.user;

      // 寫入 Firestore 的 users 集合（若尚未存在）
      const userDocRef = doc(db, "users", signedInUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          uid: signedInUser.uid,
          name: signedInUser.displayName,
          email: signedInUser.email,
          photoURL: signedInUser.photoURL,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Sign-in error:", error);
    }
  }

  async function handleSignOut() {
    await signOut(auth);
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      {user && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          {user.photoURL && (
            <Image 
              src={user.photoURL} 
              alt="User Avatar" 
              width={80} 
              height={80} 
              style={{ borderRadius: "50%", marginBottom: 8 }} 
            />
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