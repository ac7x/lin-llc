"use client";

import { useState, useMemo } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import type { AppUser } from "@/types/user";
import { ROLE_HIERARCHY } from "@/utils/authUtils";
import { db } from "@/lib/firebase-client";
import { collection, doc, updateDoc } from "firebase/firestore";

// 提取角色選項組件
const RoleSelect = ({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) => (
  <div className="flex flex-wrap gap-1">
    {Object.keys(ROLE_HIERARCHY).map((role) => (
      <button
        key={role}
        onClick={() => {
          const newRoles = value.includes(role)
            ? value.filter(r => r !== role)
            : [...value, role];
          onChange(newRoles);
        }}
        className={`
          px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap
          ${value.includes(role)
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 ring-1 ring-blue-500 dark:ring-blue-400'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }
          focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500 dark:focus:ring-offset-gray-800
          transform hover:scale-105 active:scale-95
        `}
      >
        {role}
      </button>
    ))}
  </div>
);

// 載入狀態組件
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
      // 更新 Firestore 中的角色
      const userDoc = doc(usersCollection, uid);
      await updateDoc(userDoc, { roles: newRoles });

      // 更新 Custom Claims
      const currentRoles = users.find(u => u.uid === uid)?.roles || [];
      const addedRoles = newRoles.filter(role => !currentRoles.includes(role));
      const removedRoles = currentRoles.filter(role => !newRoles.includes(role));

      // 設定新增的角色
      for (const role of addedRoles) {
        await fetch('/api/auth/role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid,
            role,
            action: 'set'
          })
        });
      }

      // 移除被刪除的角色
      for (const role of removedRoles) {
        await fetch('/api/auth/role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid,
            role,
            action: 'remove'
          })
        });
      }
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
          <LoadingSpinner />
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/50 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
            {error.message}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">Email</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">建立時間</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">最後登入</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">狀態</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">角色</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200">
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-100">
                      <div className="flex flex-col">
                        <span>{user.email || "—"}</span>
                        {user.displayName && (
                          <span className="text-gray-500 dark:text-gray-400 text-[10px]">({user.displayName})</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-100">
                      {user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-100">
                      {user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                        user.disabled 
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" 
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      }`}>
                        {user.disabled ? "停用" : "啟用"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">
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