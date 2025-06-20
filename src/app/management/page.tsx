'use client';

import { useAuth } from '@/hooks/useAuth';
import RolePermissions from './components/RolePermissions';

export default function ManagementPage() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-8">
        <RolePermissions />
      </div>
    </div>
  );
}
