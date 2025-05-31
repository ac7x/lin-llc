// src/app/page.tsx
"use client";
import { useAuthState } from "react-firebase-hooks/auth";
import { useFirebase } from "@/modules/shared/infrastructure/persistence/firebase/FirebaseContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { signInWithGooglePopup, signInWithGoogleRedirect, saveUserToFirestore } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

const isMobile = () => {
  if (typeof window === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
};

export default function HomePage() {
  const { auth, db, doc, getDoc } = useFirebase();
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    const redirectByRole = async () => {
      if (user) {
        await saveUserToFirestore(user); // 寫入 Firestore users 集合
        // 取得 Firestore 中的 user 資料
        const userDoc = await getDoc(doc(db, "users", user.uid));
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
  }, [user, router, db, doc, getDoc]);

  const handleGoogleLogin = async () => {
    try {
      if (isMobile()) {
        await signInWithGoogleRedirect();
      } else {
        await signInWithGooglePopup();
      }
    } catch {
      alert("登入失敗");
    }
  };

  if (loading) return <div className="p-6 text-center">載入中...</div>;

  if (user) return <div className="p-6 text-center">重定向中...</div>;

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