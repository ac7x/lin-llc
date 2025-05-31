"use client";
import { useAuthState } from "react-firebase-hooks/auth";
import { useFirebase } from "@/modules/shared/infrastructure/persistence/firebase/FirebaseContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const isMobile = () => {
  if (typeof window === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
};

// Google 登入 - Popup 方式
const signInWithGooglePopup = async (auth: any, GoogleAuthProvider: any, signInWithPopup: any) => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
};

// Google 登入 - Redirect 方式
const signInWithGoogleRedirect = async (auth: any, GoogleAuthProvider: any, signInWithRedirect: any) => {
  const provider = new GoogleAuthProvider();
  await signInWithRedirect(auth, provider);
};

// 儲存用戶資料到 Firestore
const saveUserToFirestore = async (
  user: {
    uid: string;
    email?: string | null;
    emailVerified?: boolean;
    displayName?: string | null;
    photoURL?: string | null;
  },
  db: any,
  docFn: any,
  setDoc: any
) => {
  if (!user?.uid) return;
  await setDoc(
    docFn(db, "users", user.uid),
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

export default function HomePage() {
  const {
    auth,
    db,
    doc: docFn,
    getDoc,
    setDoc,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    signOut,
  } = useFirebase();
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    const redirectByRole = async () => {
      if (user) {
        await saveUserToFirestore(user, db, docFn, setDoc); // 寫入 Firestore users 集合
        // 取得 Firestore 中的 user 資料
        const userDoc = await getDoc(docFn(db, "users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const role = userData.role || "user";
        // 根據角色跳轉
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
  }, [user, router, db, docFn, getDoc, setDoc]);

  const handleGoogleLogin = async () => {
    try {
      if (isMobile()) {
        await signInWithGoogleRedirect(auth, GoogleAuthProvider, signInWithRedirect);
      } else {
        await signInWithGooglePopup(auth, GoogleAuthProvider, signInWithPopup);
      }
    } catch {
      alert("登入失敗");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      alert("登出失敗");
    }
  };

  if (loading) return <div className="p-6 text-center">載入中...</div>;

  if (user) return (
    <div className="p-6 text-center">
      <div>重定向中...</div>
      <button
        className="mt-4 px-4 py-2 bg-gray-300 rounded"
        onClick={handleSignOut}
      >
        登出
      </button>
    </div>
  );

  return (
    <div className="p-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Google 帳號登入</h1>
      <button
        className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
        onClick={handleGoogleLogin}
      >
        使用 Google 帳號登入
      </button>
    </div>
  );
}