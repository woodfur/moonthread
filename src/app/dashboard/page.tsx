'use client';

import { useEffect, useState, useRef } from 'react';
import { Wrench, ClipboardCheck, CalendarDays, DollarSign, ArrowUpRight, Clock, CheckCircle, AlertTriangle, TrendingUp, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { WORK_ORDER_STATUS_LABELS } from '@/lib/constants';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import type { WorkOrder, Notification } from '@/types';

const STATUS_VARIANT: Record<string, 'accent' | 'success' | 'warning' | 'danger' | 'neutral'> = {
    submitted: 'accent', pending_approval: 'warning', approved: 'success',
    in_progress: 'accent', completed: 'success', rejected: 'danger', on_hold: 'neutral',
};

interface Stats {
    open_work_orders: number;
    pending_approvals: number;
    upcoming_bookings: number;
    monthly_spend: number;
}

export default function DashboardPage() {
    const [userName, setUserName] = useState('');
    const [stats, setStats] = useState<Stats>({ open_work_orders: 0, pending_approvals: 0, upcoming_bookings: 0, monthly_spend: 0 });
    const [recentWOs, setRecentWOs] = useState<WorkOrder[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();

        async function fetchData() {
            // Get current user
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: profile } = await supabase.from('users').select('full_name').eq('id', authUser.id).single();
                setUserName(profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User');

                // Notifications
                const { data: notifs } = await supabase.from('notifications').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }).limit(5);
                if (notifs) setNotifications(notifs as Notification[]);
            }

            // Work Orders
            const { data: workOrders } = await supabase
                .from('work_orders')
                .select('*, submitter:users!submitted_by(full_name), area:facility_areas!location_area(name)')
                .order('created_at', { ascending: false })
                .limit(5);
            if (workOrders) setRecentWOs(workOrders as WorkOrder[]);

            // Stats
            const { count: openWO } = await supabase.from('work_orders').select('*', { count: 'exact', head: true }).in('status', ['submitted', 'pending_approval', 'approved', 'in_progress']);
            const { count: pending } = await supabase.from('work_orders').select('*', { count: 'exact', head: true }).eq('status', 'pending_approval');
            const { count: bookings } = await supabase.from('space_bookings').select('*', { count: 'exact', head: true }).gte('booking_date', new Date().toISOString().split('T')[0]);
            const { data: expenses } = await supabase.from('expenses').select('amount');
            const spend = (expenses || []).reduce((s, e) => s + Number(e.amount), 0);

            setStats({
                open_work_orders: openWO || 0,
                pending_approvals: pending || 0,
                upcoming_bookings: bookings || 0,
                monthly_spend: spend,
            });

            setLoading(false);
        }

        fetchData();
    }, []);

    const [showNewMenu, setShowNewMenu] = useState(false);
    const newMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) setShowNewMenu(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <div className="spinner-lg" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: '13px' }}>Loading dashboard…</p>
            </div>
        </div>
    );

    const NEW_ITEMS = [
        { label: 'Work Order', href: '/dashboard/work-orders/new', icon: Wrench },
        { label: 'Asset', href: '/dashboard/assets/new', icon: ClipboardCheck },
        { label: 'Vendor', href: '/dashboard/vendors/new', icon: ArrowUpRight },
        { label: 'Expense', href: '/dashboard/expenses/new', icon: DollarSign },
        { label: 'Supply Request', href: '/dashboard/supply-requests/new', icon: Clock },
        { label: 'Booking', href: '/dashboard/spaces/bookings/new', icon: CalendarDays },
    ];

    return (
        <div>
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '28px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                        Overview
                    </h1>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Hi {userName.split(' ')[0] || 'there'} 👋 — Welcome Back
                    </p>
                </div>
                {/* New Dropdown */}
                <div ref={newMenuRef} style={{ position: 'relative' }}>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowNewMenu(!showNewMenu)}
                        style={{ gap: '6px' }}
                    >
                        <Plus style={{ width: 15, height: 15 }} /> New
                    </button>
                    {showNewMenu && (
                        <div style={{
                            position: 'absolute', top: '44px', right: 0, width: '200px',
                            background: 'var(--surface)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
                            zIndex: 50, overflow: 'hidden', padding: '4px 0',
                        }}>
                            {NEW_ITEMS.map((item) => (
                                <a
                                    key={item.label}
                                    href={item.href}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '10px 16px', fontSize: '13px', fontWeight: 500,
                                        color: 'var(--text-primary)', textDecoration: 'none',
                                        transition: 'background var(--duration) var(--ease)',
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <item.icon style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />
                                    {item.label}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <StatCard icon={<Wrench style={{ width: 18, height: 18, color: '#D4A843' }} />} iconBg="var(--accent-light)" label="Open Work Orders" value={stats.open_work_orders} />
                <StatCard icon={<ClipboardCheck style={{ width: 18, height: 18, color: '#22C55E' }} />} iconBg="var(--success-light)" label="Pending Approvals" value={stats.pending_approvals} />
                <StatCard icon={<DollarSign style={{ width: 18, height: 18, color: '#F59E0B' }} />} iconBg="var(--warning-light)" label="Monthly Spend" value={formatCurrency(stats.monthly_spend)} />
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {[
                    { icon: Wrench, label: 'New Work Order', href: '/dashboard/work-orders/new', color: 'var(--accent)' },
                    { icon: Clock, label: 'View Pending', href: '/dashboard/work-orders', color: '#8B5CF6' },
                    { icon: TrendingUp, label: 'Reports', href: '/dashboard/reports', color: '#22C55E' },
                ].map((action) => (
                    <a key={action.label} href={action.href} className="card card-pad" style={{
                        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px',
                        cursor: 'pointer', transition: 'all var(--duration) var(--ease)',
                    }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: `${action.color}15`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <action.icon style={{ width: 16, height: 16, color: action.color }} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{action.label}</span>
                    </a>
                ))}
            </div>

            {/* Recent Work Orders Table */}
            <div className="card" style={{ overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '18px 24px', borderBottom: '1px solid var(--border-light)',
                }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Recent Work Orders</span>
                    <a href="/dashboard/work-orders" style={{
                        fontSize: '12px', fontWeight: 500, color: 'var(--accent-muted)',
                        display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none',
                    }}>View All <ArrowUpRight style={{ width: 13, height: 13 }} /></a>
                </div>
                {recentWOs.length > 0 ? (
                    <table className="data-table">
                        <thead><tr><th>ID</th><th>Description</th><th>Category</th><th>Status</th><th>Submitted</th></tr></thead>
                        <tbody>
                            {recentWOs.map((wo) => (
                                <tr key={wo.id}>
                                    <td><span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 500, color: 'var(--accent-muted)' }}>{wo.work_order_number}</span></td>
                                    <td>
                                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{wo.description}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>by {wo.submitter?.full_name}</div>
                                    </td>
                                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{wo.category.replace('_', ' ')}</td>
                                    <td><StatusBadge label={WORK_ORDER_STATUS_LABELS[wo.status]} variant={STATUS_VARIANT[wo.status] || 'neutral'} /></td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatRelativeTime(wo.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ padding: '48px', textAlign: 'center' }}>
                        <CheckCircle style={{ width: 32, height: 32, color: 'var(--border)', margin: '0 auto 12px' }} />
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No work orders yet. Create one to get started.</p>
                    </div>
                )}
            </div>

            {/* Recent Activity */}
            <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Recent Activity</span>
                </div>
                {notifications.length > 0 ? notifications.map((n) => (
                    <div key={n.id} style={{ padding: '14px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.is_read ? 'var(--border)' : 'var(--accent)', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{n.title}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{formatRelativeTime(n.created_at)}</div>
                        </div>
                    </div>
                )) : (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No recent activity</div>
                )}
            </div>
        </div>
    );
}
