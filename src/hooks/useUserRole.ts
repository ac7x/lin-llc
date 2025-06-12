import { useMemo } from 'react';
import { useAuth, doc, db } from '@/hooks/useFirebase';
import { useDocument } from 'react-firebase-hooks/firestore';
import type { AppUser } from '@/types/user';
import { ROLE_HIERARCHY } from '@/utils/roleHierarchy';

const ROLE_CHECKS = {
    owner: 'isOwner',
    admin: 'isAdmin',
    finance: 'isFinance',
    user: 'isUser',
    helper: 'isHelper',
    temporary: 'isTemporary',
    coord: 'isCoord',
    safety: 'isSafety',
    foreman: 'isForeman',
    vendor: 'isVendor'
} as const;

export interface UseUserRoleReturn {
    userRole: string | undefined;
    userRoles: string[];
    loading: boolean;
    error: Error | undefined;
    hasRole: (role: string) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
    hasMinRole: (minRole: string) => boolean;
    isOwner: boolean;
    isAdmin: boolean;
    isFinance: boolean;
    isUser: boolean;
    isHelper: boolean;
    isTemporary: boolean;
    isCoord: boolean;
    isSafety: boolean;
    isForeman: boolean;
    isVendor: boolean;
}

export function useUserRole(): UseUserRoleReturn {
    const { user } = useAuth();
    const [userDoc, loading, error] = useDocument(
        user ? doc(db, 'users', user.uid) : null
    );

    const userRole = useMemo(() => {
        const userData = userDoc?.data() as AppUser | undefined;
        return userData?.role;
    }, [userDoc]);

    const userRoles = useMemo(() => {
        const userData = userDoc?.data() as AppUser | undefined;
        return (userData?.roles || [userData?.role])
            .filter((role): role is string => role !== undefined);
    }, [userDoc]);

    const hasRole = useMemo(() => (role: string): boolean => {
        return userRole === role;
    }, [userRole]);

    const hasAnyRole = useMemo(() => (roles: string[]): boolean => {
        return userRoles.some(role => role !== undefined && roles.includes(role));
    }, [userRoles]);

    const hasMinRole = useMemo(() => (minRole: string): boolean => {
        if (!userRole) return false;
        const userLevel = ROLE_HIERARCHY[userRole] || 0;
        const minLevel = ROLE_HIERARCHY[minRole] || 0;
        return userLevel >= minLevel;
    }, [userRole]);

    // 使用 Object 來生成角色判斷函數
    const roleChecks = useMemo(() => {
        const checks = {
            isOwner: false,
            isAdmin: false,
            isFinance: false,
            isUser: false,
            isHelper: false,
            isTemporary: false,
            isCoord: false,
            isSafety: false,
            isForeman: false,
            isVendor: false
        };
        
        Object.entries(ROLE_CHECKS).forEach(([role, propertyName]) => {
            checks[propertyName as keyof typeof checks] = hasRole(role);
        });
        
        return checks;
    }, [hasRole]);

    return {
        userRole,
        userRoles,
        loading,
        error,
        hasRole,
        hasAnyRole,
        hasMinRole,
        ...roleChecks
    };
}