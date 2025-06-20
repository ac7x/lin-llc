"use client";

import { ReactNode } from "react";
import { PermissionCheck } from "@/components/common/PermissionCheck";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps): React.ReactElement {
  return (
    <PermissionCheck requiredPermission="dashboard">
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 p-6">{children}</div>
      </div>
    </PermissionCheck>
  );
}
