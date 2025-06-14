"use client";

import { useState, useMemo } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import type { AppUser } from "@/types/user";
import { ROLE_HIERARCHY } from "@/utils/roleHierarchy";
import { db } from "@/lib/firebase-client";
import { collection, doc, updateDoc } from "firebase/firestore";

// 提取角色選項組件
const RoleSelect = ({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) => (
  <div className="flex flex-wrap gap-2">
    {Object.keys(ROLE_HIERARCHY).map((role) => (
      <label key={role} className="inline-flex items-center">
        <input
          type="checkbox"
          checked={value.includes(role)}
          onChange={(e) => {
            const newRoles = e.target.checked
              ? [...value, role]
              : value.filter(r => r !== role);
            onChange(newRoles);
          }}
          className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-700"
        />
        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{role}</span>
      </label>
    ))}
  </div>
);

export default function AdminUsersPage() {
  const usersCollection = collection(db, "users");
  const [formError, setFormError] = useState<string | null>(null);

  // 使用 useMemo 優化用戶列表
  const [snapshot, loading, error] = useCollection(usersCollection);
  const users = useMemo(() => 
    snapshot?.docs.map(doc => doc.data() as AppUser) || [],
    [snapshot]
  );

  // 更新用戶角色
  const updateUserRole = async (uid: string, newRoles: string[]): Promise<void> => {
    try {
      const userDoc = doc(usersCollection, uid);
      await updateDoc(userDoc, { roles: newRoles });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "角色更新失敗");
    }
  };

  return (
    <main className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-6">Firebase 用戶管理</h1>

        {formError && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/50 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
            {formError}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/50 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
            {error.message}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">名稱</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">建立時間</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">最後登入</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">狀態</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">角色</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{user.email || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{user.displayName || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {user.metadata?.creationTime?.slice(0, 10) || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {user.metadata?.lastSignInTime?.slice(0, 10) || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.disabled 
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" 
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      }`}>
                        {user.disabled ? "停用" : "啟用"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <RoleSelect
                        value={user.roles || []}
                        onChange={(value) => updateUserRole(user.uid, value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}