"use client";

import { GoogleLogo, SignOut } from "phosphor-react";
import { GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";
import { useState } from "react";
import { auth, db } from "@/lib/firebase/firebase-client";
import { setDoc, doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import { serverTimestamp } from "firebase/firestore";

export default function SignIn() {
    const [user, setUser] = useState<User | null>(null);

    async function handleGoogleSignIn() {
        const provider = new GoogleAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider);

            setUser(result.user);

            if (result.user) {
                const { uid, displayName, email, photoURL } = result.user;
                const userRef = doc(db, "users", uid);
                const snap = await getDoc(userRef);
                await setDoc(
                    userRef,
                    snap.exists()
                        ? { displayName, email, photoURL }
                        : { uid, displayName, email, photoURL, role: "user", emailVerified: false, updatedAt: serverTimestamp(), disabled: false, metadata: { creationTime: new Date().toISOString(), lastSignInTime: "" } },
                    { merge: true }
                );
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function handleSignOut() {
        await signOut(auth);
        setUser(null);
    }

    const containerStyle: React.CSSProperties = {
        width: "100%",
        height: "100vh",
        display: "flex",
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
    };

    const buttonStyle: React.CSSProperties = {
        height: 56,
        width: 650,
        color: "var(--text)",
        background: "none",
        borderImage: "linear-gradient(to right, var(--primary), var(--gray)) 1",
        marginTop: 32,
        fontSize: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background-color 0.3s",
    };

    const userStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginBottom: 64,
    };

    const imgStyle: React.CSSProperties = {
        width: 140,
        height: 140,
        borderRadius: "50%",
        marginBottom: 16,
    };

    return (
        <div style={containerStyle}>
            {user && (
                <div style={userStyle}>
                    {user.photoURL && (
                        <Image
                            src={user.photoURL}
                            alt="使用者頭像"
                            width={140}
                            height={140}
                            style={imgStyle}
                        />
                    )}
                    <strong>{user.displayName}</strong>
                    <small>{user.email}</small>
                </div>
            )}

            {user ? (
                <button type="button" style={buttonStyle} onClick={handleSignOut}>
                    <SignOut style={{ fontSize: 24, marginRight: 7 }} />
                    登出
                </button>
            ) : (
                <button type="button" style={buttonStyle} onClick={handleGoogleSignIn}>
                    <GoogleLogo style={{ fontSize: 24, marginRight: 7 }} />
                    Entrar com Google
                </button>
            )}
        </div>
    );
}