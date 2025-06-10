import { useMemo } from 'react';
import { useFirebase, doc, db } from '@/lib/firebase-context';
import { useDocument } from 'react-firebase-hooks/firestore';
import type { AppUser } from '@/types/user';

// 角色層級定義（數字越高權限越大）
const ROLE_HIERARCHY: Record<string, number> = {
    'user': 1,
    'helper': 2,
    'temporary': 3,
    'coord': 4,
    'safety': 5,
    'foreman': 6,
    'vendor': 7,
    'finance': 8,
    'admin': 9,
    'owner': 10,
};

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
    const { user } = useFirebase();
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