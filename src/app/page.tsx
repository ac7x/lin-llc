"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirebase } from "@/modules/shared/infrastructure/persistence/firebase/FirebaseContext";
import { getRedirectResult } from "firebase/auth";

const isMobile = () =>
  typeof window !== "undefined" &&
  /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

const saveUserToFirestore = async (
  user: any,
  db: any,
  doc: any,
  setDoc: any
) => {
  if (!user?.uid) return;
  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      email: user.email || "",
      emailVerified: user.emailVerified ?? false,
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      updatedAt: new Date(),
    },
    { merge: true }
  );
};

export default function LoginPage() {
  const {
    auth,
    db,
    doc,
    getDoc,
    setDoc,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    signOut,
    useAuthState,
  } = useFirebase();

  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        await getRedirectResult(auth);
      } catch (error) {
        console.error("getRedirectResult 錯誤：", error);
      }
    };
    handleRedirectResult();
  }, [auth]);

  useEffect(() => {
    const redirectByRole = async () => {
      if (user) {
        await saveUserToFirestore(user, db, doc, setDoc);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const role = userData.role || "owner";
        if (role === "owner") {
          router.push("/owner");
        } else if (role === "finance") {
          router.push("/finance");
        } else if (role === "admin") {
          router.push("/admin");
        } else {
          router.push("/user/profile");
        }
      }
    };
    redirectByRole();
  }, [user, db, doc, getDoc, setDoc, router]);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      if (isMobile()) {
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (err) {
      alert("登入失敗：" + (err as Error).message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {
      alert("登出失敗");
    }
  };

  if (loading) return <div className="p-6 text-center">載入中...</div>;

  if (user) {
    return (
      <div className="p-6 text-center">
        <div>登入成功，正在重定向...</div>
        <button
          className="mt-4 px-4 py-2 bg-gray-300 rounded"
          onClick={handleSignOut}
        >
          登出
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">使用 Google 帳號登入</h1>
      <button
        className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
        onClick={handleGoogleLogin}
      >
        Google 登入
      </button>
    </div>
  );
}