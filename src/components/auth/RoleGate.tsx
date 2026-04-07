'use client';

import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import type { UserRole } from '@/types';

interface RoleGateProps {
    /** Roles that are allowed to see the children */
    allowedRoles: UserRole[];
    /** Content rendered if the user's role is not in allowedRoles (optional) */
    fallback?: ReactNode;
    children: ReactNode;
}

/**
 * Conditionally renders children based on the current user's role.
 *
 * Usage:
 * ```tsx
 * <RoleGate allowedRoles={['admin', 'facility_manager']}>
 *   <button>Approve</button>
 * </RoleGate>
 * ```
 */
export default function RoleGate({ allowedRoles, fallback = null, children }: RoleGateProps) {
    const { role, loading } = useAuth();

    // Don't render anything while auth is loading to prevent flash
    if (loading) return null;

    if (!allowedRoles.includes(role)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
