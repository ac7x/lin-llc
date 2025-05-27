'use server';

import { firestoreAdmin } from '@/modules/shared/infrastructure/persistence/firebase/firebase-admin-client';

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

export type Project = {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
};

export async function createProject(data: { name: string; description?: string }): Promise<Project> {
  const docRef = await firestoreAdmin.collection('projects').add({
    name: data.name,
    description: data.description ?? '',
    createdAt: new Date().toISOString(),
  });

  return {
    id: docRef.id,
    name: data.name,
    description: data.description,
    createdAt: new Date().toISOString(),
  };
}