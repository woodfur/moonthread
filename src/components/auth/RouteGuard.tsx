'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { ROUTE_PERMISSIONS } from '@/lib/constants';
import type { UserRole } from '@/types';

/**
 * Resolves the allowed roles for a given pathname.
 *
 * Walks up the path tree to find the nearest matching permission entry.
 * e.g. /dashboard/vendors/new → checks /dashboard/vendors/new first,
 *      then falls back to /dashboard/vendors.
 *
 * Returns null if no permission entry is found (route is open to all authenticated users).
 */
function getAllowedRoles(pathname: string): UserRole[] | null {
    // Normalise: strip trailing slash
    const path = pathname.replace(/\/$/, '') || '/dashboard';

    // Replace dynamic segments [id] with wildcard for matching
    const segments = path.split('/');

    // Try exact match first, then walk up
    let current = path;
    while (current.length > 0) {
        if (ROUTE_PERMISSIONS[current]) {
            return ROUTE_PERMISSIONS[current];
        }
        const parts = current.split('/');
        parts.pop();
        current = parts.join('/');
    }

    // Also try replacing UUID-like segments with [id]
    const normalisedSegments = segments.map((seg) =>
        /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(seg)
            ? '[id]'
            : seg
    );
    const normalisedPath = normalisedSegments.join('/');
    let normCurrent = normalisedPath;
    while (normCurrent.length > 0) {
        if (ROUTE_PERMISSIONS[normCurrent]) {
            return ROUTE_PERMISSIONS[normCurrent];
        }
        const parts = normCurrent.split('/');
        parts.pop();
        normCurrent = parts.join('/');
    }

    return null; // No restriction found — allow access
}

export default function RouteGuard({ children }: { children: ReactNode }) {
    const { role, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    // Start as true once initially authorized — prevents flash on subsequent navigations
    const hasBeenAuthorized = useRef(false);
    const [denied, setDenied] = useState(false);

    useEffect(() => {
        if (loading) return;

        const allowedRoles = getAllowedRoles(pathname);

        if (!allowedRoles || allowedRoles.includes(role)) {
            hasBeenAuthorized.current = true;
            setDenied(false);
        } else {
            setDenied(true);
            // Redirect after a brief delay so the user sees the message
            const timeout = setTimeout(() => {
                router.replace('/dashboard');
            }, 2000);
            return () => clearTimeout(timeout);
        }
    }, [pathname, role, loading, router]);

    // Show loading spinner ONLY on first load, not on subsequent navigations
    if (loading && !hasBeenAuthorized.current) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner-lg" style={{ margin: '0 auto 12px' }} />
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading…</p>
                </div>
            </div>
        );
    }

    if (denied) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '100vh', background: 'var(--bg)',
            }}>
                <div style={{
                    textAlign: 'center', padding: '40px',
                    maxWidth: '400px',
                }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 'var(--radius-full)',
                        background: 'var(--danger-light)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px', fontSize: '24px',
                    }}>
                        🔒
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                        Access Restricted
                    </h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        You don&apos;t have permission to access this page. Redirecting to dashboard…
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
