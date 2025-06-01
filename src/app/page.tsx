"use client";
import { useFirebase, User, Firestore } from "@/modules/shared/infrastructure/persistence/firebase/FirebaseContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// 偵測是否為行動裝置
const isMobile = () => {
  if (typeof window === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
};

// 儲存或更新使用者到 Firestore
const saveUserToFirestore = async (
  user: Pick<User, "uid" | "email" | "emailVerified" | "displayName" | "photoURL">,
  db: Firestore,
  doc: typeof import("firebase/firestore").doc,
  getDoc: typeof import("firebase/firestore").getDoc,
  setDoc: typeof import("firebase/firestore").setDoc
) => {
  if (!user?.uid) return;

  const userRef = doc(db, "users", user.uid);
  const existingDocSnap = await getDoc(userRef);

  const userDataFromAuth = {
    uid: user.uid,
    email: user.email || "",
    emailVerified: user.emailVerified ?? false,
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
    updatedAt: new Date(), // 每次登入都更新時間戳
  };

  let dataToSet;

  if (!existingDocSnap.exists()) {
    // 新用戶
    dataToSet = {
      ...userDataFromAuth,
      role: "owner", // 新用戶預設為 owner
      createdAt: new Date(), // 記錄創建時間
    };
  } else {
    // 現有用戶
    const existingData = existingDocSnap.data();
    dataToSet = {
      ...userDataFromAuth,
      // 如果現有用戶沒有 role 欄位，則賦予 "owner" 角色
      // 如果已有 role，則 setDoc 時 merge:true 會保留現有角色
      ...(!existingData?.role && { role: "owner" }),
    };
  }

  await setDoc(userRef, dataToSet, { merge: true });
};

export default function HomePage() {
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
    const redirectByRole = async () => {
      if (user) {
        try {
          // 確保使用者資料 (包含角色) 在 Firestore 中是最新的
          await saveUserToFirestore(user, db, doc, getDoc, setDoc);

          // 重新從 Firestore 獲取使用者資料以進行角色判斷
          const userDocSnap = await getDoc(doc(db, "users", user.uid));

          if (!userDocSnap.exists()) {
            // 這種情況理論上不應該在 saveUserToFirestore 成功後發生
            console.error("User document not found in Firestore after attempting to save. UID:", user.uid);
            // PRODUCTION_STANDARD: 考慮使用更友好的 UI 提示取代 alert
            alert("無法驗證您的使用者資訊，請嘗試重新登入。");
            await signOut(auth); // 登出用戶
            return;
          }

          const userData = userDocSnap.data();
          // 經過 saveUserToFirestore 後，userData.role 應該存在
          // Fallback 增加穩健性，以防 userData 為空或 role 意外缺失
          const role = userData?.role || "owner";

          if (role === "owner") {
            router.push("/owner");
          } else if (role === "finance") {
            router.push("/finance");
          } else if (role === "admin") {
            router.push("/admin");
          } else {
            // 預設導向或特定 "user" 角色的導向 (例如，如果角色不匹配任何已知角色)
            router.push("/user/profile");
          }
        } catch (error) {
          console.error("Error during user processing or redirection:", error);
          // PRODUCTION_STANDARD: 考慮使用更友好的 UI 提示取代 alert，並將錯誤記錄到監控系統
          alert("處理您的帳戶時發生錯誤。如果問題持續，請聯繫支援。");
          // 根據錯誤的性質，可以考慮是否需要登出用戶
          // await signOut(auth); 
        }
      }
    };
    redirectByRole();
  }, [user, router, db, doc, getDoc, setDoc, signOut, auth]); // 確保依賴項完整

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      if (isMobile()) {
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (err) {
      console.error("登入失敗", err);
      // PRODUCTION_STANDARD: 考慮使用更友好的 UI 提示取代 alert
      alert("登入失敗，請再試一次");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {
      // PRODUCTION_STANDARD: 考慮使用更友好的 UI 提示取代 alert
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