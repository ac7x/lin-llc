import { useMemo } from 'react';
import { useAuth, doc, db } from '@/hooks/useFirebase';
import { useDocument } from 'react-firebase-hooks/firestore';
import type { AppUser } from '@/types/user';
import { ROLE_HIERARCHY } from '@/utils/roleHierarchy';

export interface UseUserRoleReturn {
    userRole: string | undefined;
    loading: boolean;
    error: Error | undefined;
    hasRole: (role: string) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
    hasMinRole: (minRole: string) => boolean;
    isOwner: boolean;
    isAdmin: boolean;
    isFinance: boolean;
}

export function useUserRole(): UseUserRoleReturn {
    const { user } = useAuth(); // 使用 useAuth 而不是 useFirebase
    const [userDoc, loading, error] = useDocument(
        user ? doc(db, 'users', user.uid) : null
    );

    const userRole = useMemo(() => {
        const userData = userDoc?.data() as AppUser | undefined;
        return userData?.role;
    }, [userDoc]);

    const hasRole = useMemo(() => (role: string): boolean => {
        return userRole === role;
    }, [userRole]);

    const hasAnyRole = useMemo(() => (roles: string[]): boolean => {
        return userRole ? roles.includes(userRole) : false;
    }, [userRole]);

    const hasMinRole = useMemo(() => (minRole: string): boolean => {
        if (!userRole) return false;
        const userLevel = ROLE_HIERARCHY[userRole] || 0;
        const minLevel = ROLE_HIERARCHY[minRole] || 0;
        return userLevel >= minLevel;
    }, [userRole]);

    const isOwner = useMemo(() => hasRole('owner'), [hasRole]);
    const isAdmin = useMemo(() => hasRole('admin'), [hasRole]);
    const isFinance = useMemo(() => hasRole('finance'), [hasRole]);

    return {
        userRole,
        loading,
        error,
        hasRole,
        hasAnyRole,
        hasMinRole,
        isOwner,
        isAdmin,
        isFinance,
    };
}