'use server';

export type FirebaseAuthUser = {
  uid: string;
  email?: string;
  displayName?: string;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  disabled?: boolean;
};

export async function fetchUsers(): Promise<FirebaseAuthUser[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/admin/list-users`);
  if (!res.ok) throw new Error('無法取得用戶列表');
  return res.json();
}

export async function deleteUser(uid: string): Promise<void> {
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/admin/delete-user?uid=${uid}`, { method: 'POST' });
}