/**
 * 受保護路由組件
 * 用於保護需要特定權限才能訪問的路由
 * 提供基於角色和權限的訪問控制
 */

"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Role } from '@/types/permission';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRoles?: Role[];
    requiredPermissions?: string[];
    redirectTo?: string;
}

export function ProtectedRoute({
    children,
    requiredRoles = [],
    requiredPermissions = [],
    redirectTo = '/'
}: ProtectedRouteProps) {
    const router = useRouter();
    const { 
        loading, 
        isAuthenticated,
        hasAnyRole,
        userPermissions
    } = useAuth();

    useEffect(() => {
        if (!loading) {
            // 檢查是否已登入
            if (!isAuthenticated) {
                router.push(redirectTo);
                return;
            }

            // 檢查角色權限
            if (requiredRoles.length > 0) {
                const hasRequiredRole = hasAnyRole(requiredRoles);
                if (!hasRequiredRole) {
                    router.push(redirectTo);
                    return;
                }
            }

            // 檢查特定權限
            if (requiredPermissions.length > 0) {
                const hasAllPermissions = requiredPermissions.every(
                    permission => userPermissions.includes(permission)
                );
                if (!hasAllPermissions) {
                    router.push(redirectTo);
                    return;
                }
            }
        }
    }, [
        loading,
        isAuthenticated,
        requiredRoles,
        requiredPermissions,
        userPermissions,
        hasAnyRole,
        router,
        redirectTo
    ]);

    if (loading) {
        return <LoadingSpinner />;
    }

    return <>{children}</>;
} 