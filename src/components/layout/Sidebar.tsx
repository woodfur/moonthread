'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, Wrench, Package, Building2,
    CalendarDays, ShoppingCart, Receipt, BarChart3,
    Settings, ChevronLeft, LogOut, UserCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { NAV_ITEMS } from '@/lib/constants';
import { getInitials } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard, Wrench, Package, Building2,
    CalendarDays, ShoppingCart, Receipt, BarChart3, Settings,
};

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
            if (authUser) {
                const { data } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();
                if (data) setUser(data as User);
            }
        });
    }, []);

    const handleLogout = async () => {
        setLoggingOut(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
    };

    const visibleItems = NAV_ITEMS.filter(
        (item) => !item.roles || !user || item.roles.includes(user.role)
    );

    return (
        <aside
            style={{
                width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
                minHeight: '100vh',
                background: 'var(--surface)',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 40,
                overflow: 'hidden',
            }}
        >
            {/* Logo + Collapse */}
            <div style={{
                padding: collapsed ? '20px 0' : '20px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                borderBottom: '1px solid var(--border-light)',
                minHeight: '64px',
            }}>
                {!collapsed && (
                    <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                            background: 'var(--accent)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            {/* <span style={{ color: 'var(--accent-text)', fontSize: '14px', fontWeight: 700 }}>F</span> */}
                        </div>
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
                        <span style={{ color: 'var(--accent-text)', fontSize: '14px', fontWeight: 700 }}>F</span>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? 'Expand' : 'Collapse'}
                    style={{
                        width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        display: collapsed ? 'none' : 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-muted)',
                        transition: 'all var(--duration) var(--ease)',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface-raised)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                    <ChevronLeft className="w-4 h-4" />
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
