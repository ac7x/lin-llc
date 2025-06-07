"use client";
import Image from "next/image";
import { auth } from "@/lib/firebase-client";
import { signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { db, doc, getDoc, setDoc } from "@/lib/firebase-context";
import { GoogleLogo, SignOut } from "phosphor-react";
import { serverTimestamp } from "firebase/firestore";

function UserInfo({ user, className = "" }: {
    user: { displayName?: string | null; email?: string | null; photoURL?: string | null; };
    className?: string;
}) {
    return (
        <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
            {user.photoURL && (
                <Image
                    src={user.photoURL}
                    alt="頭像"
                    width={64}
                    height={64}
                    className="rounded-full border-2 border-white dark:border-neutral-800 shadow"
                />
            )}
            <div className="text-lg font-semibold">{user.displayName || '—'}</div>
            <div className="text-gray-500 dark:text-gray-400 text-sm">{user.email || '—'}</div>
        </div>
    );
}

export default function ProfilePage() {
    const [user, loading] = useAuthState(auth);
    const router = useRouter();

    async function handleGoogleSignIn() {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            if (result.user) {
                const { uid, displayName, email, photoURL } = result.user;
                const userRef = doc(db, "users", uid);
                const snap = await getDoc(userRef);
                await setDoc(
                    userRef,
                    snap.exists()
                        ? { displayName, email, photoURL }
                        : {
                            uid, displayName, email, photoURL,
                            role: "user",
                            emailVerified: false,
                            updatedAt: serverTimestamp(),
                            disabled: false,
                            metadata: {
                                creationTime: new Date().toISOString(),
                                lastSignInTime: ""
                            }
                        },
                    { merge: true }
                );
            }
        } catch (error) {
            console.error(error);
        }
    }

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/");
    };

    // 新增 Firestore 讀取，觸發 App Check
    useEffect(() => {
        const testAppCheck = async () => {
            try {
                // 隨便讀一個不存在的文件
                const ref = doc(db, "test", "appcheck-demo");
                await getDoc(ref);
                // 你可以在這裡 console.log("App Check Firestore read success");
            } catch {
                // 忽略錯誤
            }
        };
        testAppCheck();

        // 顯示 App Check 狀態
        // console.log(diagnoseAppCheck());
    }, []);

    if (loading) return <div className="p-6 flex items-center justify-center min-h-screen">載入中...</div>;
    if (!user) return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900">
            <div className="p-8 max-w-md w-full bg-white dark:bg-neutral-900 shadow-xl rounded-xl flex flex-col items-center justify-center space-y-6">
                <button
                    className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
                    onClick={handleGoogleSignIn}
                >
                    <GoogleLogo weight="bold" />
                    使用 Google 登入
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900">
            <div className="p-8 max-w-md w-full bg-white dark:bg-neutral-900 shadow-xl rounded-xl flex flex-col items-center justify-center space-y-6 mx-auto">
                <UserInfo user={user} className="w-full" />
                <button
                    className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold text-lg mt-2 text-center flex items-center justify-center gap-2"
                    onClick={handleLogout}
                >
                    <SignOut weight="bold" />
                    登出
                </button>
            </div>
        </div>
    );
}