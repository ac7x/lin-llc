"use client";

import { useState, useMemo } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { useForm } from "react-hook-form";
import { useFirebase } from "@/hooks/useFirebase";
import type { AppUser } from "@/types/user";
import { ROLE_HIERARCHY } from "@/utils/roleHierarchy";

// 提取角色選項組件
const RoleSelect = ({ value, onChange, className = "" }: { value: string; onChange: (value: string) => void; className?: string }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`border rounded px-1 py-0.5 bg-white dark:bg-gray-800 ${className}`}
  >
    <option value="">—</option>
    {Object.keys(ROLE_HIERARCHY).map((role) => (
      <option key={role} value={role}>
        {role}
      </option>
    ))}
  </select>
);

export default function AdminUsersPage() {
  const { db, collection, doc, updateDoc, setDoc, serverTimestamp } = useFirebase();
  const usersCollection = collection(db, "users");
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm<{
    displayName: string;
    role: string;
  }>();

  // 使用 useMemo 優化用戶列表
  const [snapshot, loading, error] = useCollection(usersCollection);
  const users = useMemo(() => 
    snapshot?.docs.map(doc => doc.data() as AppUser) || [],
    [snapshot]
  );

  // 更新用戶角色
  const updateUserRole = async (uid: string, newRole: string): Promise<void> => {
    try {
      const userDoc = doc(usersCollection, uid);
      await updateDoc(userDoc, { role: newRole });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "角色更新失敗");
    }
  };

  // 建立虛擬用戶
  const createVirtualUser = async ({
    displayName,
    role,
  }: {
    displayName: string;
    role: string;
  }): Promise<void> => {
    const newDocRef = doc(usersCollection);
    const newUser: AppUser = {
      uid: newDocRef.id,
      email: "",
      displayName,
      emailVerified: false,
      photoURL: "",
      disabled: false,
      role,
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: "",
      },
    };
    await setDoc(newDocRef, {
      ...newUser,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  };

  const onSubmit = async (data: { displayName: string; role: string }) => {
    if (!data.displayName || !data.role) {
      setFormError("請輸入名稱並選擇角色");
      return;
    }
    setFormError(null);
    try {
      await createVirtualUser(data);
      reset();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "建立虛擬用戶失敗");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-3xl mx-auto px-2 py-8">
        <h1 className="text-2xl font-bold mb-4 text-center">Firebase 用戶管理</h1>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-6 flex flex-col sm:flex-row gap-2 items-center justify-center"
        >
          <input
            type="text"
            placeholder="名稱"
            {...register("displayName")}
            className="border rounded px-2 py-1 w-40"
          />
          <RoleSelect
            value=""
            onChange={(value) => register("role").onChange({ target: { value } })}
            className="w-32"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
          >
            建立虛擬用戶
          </button>
        </form>
        {formError && <div className="text-red-600">{formError}</div>}
        {loading && <div>載入中...</div>}
        {error && <div className="text-red-600">{error.message}</div>}
        <table className="w-full border-collapse mb-8 text-left">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="border px-2 py-1">Email</th>
              <th className="border px-2 py-1">名稱</th>
              <th className="border px-2 py-1">建立時間</th>
              <th className="border px-2 py-1">最後登入</th>
              <th className="border px-2 py-1">狀態</th>
              <th className="border px-2 py-1">角色</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.uid}
                className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800"
              >
                <td className="border px-2 py-1">{user.email || "—"}</td>
                <td className="border px-2 py-1">{user.displayName || "—"}</td>
                <td className="border px-2 py-1">
                  {user.metadata?.creationTime?.slice(0, 10) || "—"}
                </td>
                <td className="border px-2 py-1">
                  {user.metadata?.lastSignInTime?.slice(0, 10) || "—"}
                </td>
                <td className="border px-2 py-1">{user.disabled ? "停用" : "啟用"}</td>
                <td className="border px-2 py-1">
                  <RoleSelect
                    value={user.role || ""}
                    onChange={(value) => updateUserRole(user.uid, value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}