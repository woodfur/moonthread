'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, Wrench, Package, Building2,
    CalendarDays, ShoppingCart, Receipt, BarChart3,
    Settings, ChevronLeft, LogOut, UserCircle, Droplets, X,
} from 'lucide-react';
import { useState } from 'react';
import { NAV_ITEMS } from '@/lib/constants';
import { getInitials } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useMobileMenu } from '@/app/dashboard/layout';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard, Wrench, Package, Building2,
    CalendarDays, ShoppingCart, Receipt, BarChart3, Settings, Droplets,
};

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const { user, role } = useAuth();
    const { isOpen: mobileOpen, close: closeMobile } = useMobileMenu();

    const handleLogout = async () => {
        setLoggingOut(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
    };

    const visibleItems = NAV_ITEMS.filter(
        (item) => !item.roles || item.roles.includes(role)
    );

    return (
        <aside
            className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}
        >
            {/* Logo + Collapse / Close */}
            <div className="sidebar-header">
                {!collapsed && (
                    <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                            MOONTHREAD
                        </span>
                    </Link>
                )}
                {collapsed && (
                    <div style={{
                        width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                        background: 'var(--accent)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <span style={{ color: 'var(--accent-text)', fontSize: '14px', fontWeight: 700 }}>M</span>
                    </div>
                )}

                {/* Desktop: collapse button */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? 'Expand' : 'Collapse'}
                    className="sidebar-collapse-btn"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Mobile: close button */}
                <button
                    onClick={closeMobile}
                    className="sidebar-close-btn"
                >
                    <X style={{ width: 20, height: 20 }} />
                </button>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: collapsed ? '12px 8px' : '12px 12px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {visibleItems.map((item) => {
                        const Icon = ICON_MAP[item.icon];
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={closeMobile}
                                title={collapsed ? item.label : undefined}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: collapsed ? '10px' : '9px 12px',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '13px',
                                    fontWeight: isActive ? 600 : 500,
                                    color: isActive ? 'var(--accent-muted)' : 'var(--text-secondary)',
                                    background: isActive ? 'var(--accent-light)' : 'transparent',
                                    textDecoration: 'none',
                                    transition: 'all var(--duration) var(--ease)',
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                }}
                                onMouseOver={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'var(--surface-raised)';
                                        e.currentTarget.style.color = 'var(--text-primary)';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                    }
                                }}
                            >
                                {Icon && <Icon className="w-[18px] h-[18px] flex-shrink-0" />}
                                {!collapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Bottom section */}
            <div style={{
                borderTop: '1px solid var(--border-light)',
                padding: collapsed ? '12px 8px' : '12px',
            }}>
                {/* Logout button */}
                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                        padding: collapsed ? '10px' : '9px 12px', borderRadius: 'var(--radius-sm)',
                        fontSize: '13px', fontWeight: 500, color: 'var(--danger)',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        transition: 'all var(--duration) var(--ease)',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'var(--danger-light)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                    <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
                    {!collapsed && <span>{loggingOut ? 'Signing out…' : 'Logout'}</span>}
                </button>

                {/* User profile link */}
                {user && !collapsed && (
                    <Link
                        href="/dashboard/profile"
                        onClick={closeMobile}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 12px', marginTop: '4px',
                            borderRadius: 'var(--radius-sm)', textDecoration: 'none',
                            transition: 'all var(--duration) var(--ease)',
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface-raised)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                        <div style={{
                            width: 32, height: 32, borderRadius: 'var(--radius-full)',
                            background: 'var(--accent-light)', color: 'var(--accent-muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: 600, flexShrink: 0,
                        }}>
                            {getInitials(user.full_name)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user.full_name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user.email}
                            </div>
                        </div>
                        <UserCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                    </Link>
                )}
            </div>
        </aside>
    );
}
