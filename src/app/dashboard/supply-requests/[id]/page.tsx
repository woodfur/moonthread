'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, CheckCircle, XCircle, User, MapPin, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import type { SupplyRequest, SupplyRequestItem, SupplyRequestStatus, UserRole } from '@/types';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'accent'> = {
    pending: 'warning', approved: 'success', partially_approved: 'accent', rejected: 'danger', fulfilled: 'success',
};

const PRIORITY_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'accent'> = {
    low: 'neutral', medium: 'accent', high: 'warning', urgent: 'danger',
};

const NEXT_STATUSES: Record<string, { label: string; status: SupplyRequestStatus; variant: string }[]> = {
    pending: [
        { label: 'Approve All', status: 'approved', variant: 'success' },
        { label: 'Reject', status: 'rejected', variant: 'danger' },
    ],
    approved: [
        { label: 'Mark Fulfilled', status: 'fulfilled', variant: 'success' },
    ],
};

export default function SupplyRequestDetailPage() {
    const { id } = useParams();
    const [request, setRequest] = useState<SupplyRequest | null>(null);
    const [items, setItems] = useState<SupplyRequestItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<UserRole>('staff');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const supabase = createClient();
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: p } = await supabase.from('users').select('role').eq('id', user.id).single();
                setUserRole((p?.role || 'staff') as UserRole);
            }
            const [{ data: r }, { data: i }] = await Promise.all([
                supabase.from('supply_requests')
                    .select('*, submitter:users!submitted_by(full_name), area:facility_areas!area_of_use(name)')
                    .eq('id', id).single(),
                supabase.from('supply_request_items').select('*').eq('supply_request_id', id),
            ]);
            if (r) setRequest(r as SupplyRequest);
            if (i) setItems(i as SupplyRequestItem[]);
            setLoading(false);
        }
        load();
    }, [id]);

    const handleStatusChange = async (newStatus: SupplyRequestStatus) => {
        if (!request) return;
        setUpdating(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from('supply_requests')
            .update({ status: newStatus, approved_by: user?.id })
            .eq('id', request.id);
        if (!error) setRequest({ ...request, status: newStatus });
        setUpdating(false);
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading supply request…</p>
        </div>
    );

    if (!request) return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: 'var(--text-muted)' }}>Supply request not found</p>
            <Link href="/dashboard/supply-requests" className="btn btn-secondary" style={{ marginTop: '16px', textDecoration: 'none' }}>Back to Supply Requests</Link>
        </div>
    );

    const canManage = userRole === 'admin' || userRole === 'facility_manager';
    const actions = canManage ? (NEXT_STATUSES[request.status] || []) : [];

    return (
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Link href="/dashboard/supply-requests" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', padding: '8px' }}>
                    <ArrowLeft style={{ width: 18, height: 18 }} />
                </Link>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>Supply Request Details</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <StatusBadge label={request.status.replace('_', ' ')} variant={STATUS_VARIANT[request.status] || 'neutral'} />
                        <StatusBadge label={request.priority} variant={PRIORITY_VARIANT[request.priority] || 'neutral'} />
                    </div>
                </div>
            </div>

            {/* Status Actions */}
            {actions.length > 0 && (
                <div className="card card-pad" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-raised)' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginRight: 'auto' }}>Actions:</span>
                    {actions.map((a) => (
                        <button key={a.status} onClick={() => handleStatusChange(a.status)} disabled={updating}
                            className="btn btn-sm"
                            style={{
                                background: a.variant === 'success' ? 'var(--success)' : a.variant === 'danger' ? 'var(--danger)' : 'var(--accent)',
                                color: a.variant === 'accent' ? 'var(--accent-text)' : '#fff', border: 'none',
                            }}
                        >{a.label}</button>
                    ))}
                </div>
            )}

            {/* Info */}
            <div className="card" style={{ overflow: 'hidden', marginBottom: '16px' }}>
                {[
                    { icon: User, label: 'Submitted By', value: request.submitter?.full_name || '—' },
                    { icon: MapPin, label: 'Area of Use', value: request.area?.name || '—' },
                    { icon: Clock, label: 'Submitted', value: `${formatDate(request.created_at)} (${formatRelativeTime(request.created_at)})` },
                ].map((item, idx, arr) => (
                    <div key={item.label} style={{
                        display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 24px',
                        borderBottom: idx < arr.length - 1 ? '1px solid var(--border-light)' : undefined,
                    }}>
                        <item.icon style={{ width: 15, height: 15, color: 'var(--text-muted)', flexShrink: 0 }} />
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '100px' }}>{item.label}</div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.value}</div>
                    </div>
                ))}
            </div>

            {/* Items */}
            <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Items ({items.length})</span>
                </div>
                {items.map((item, idx) => (
                    <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 24px',
                        borderBottom: idx < items.length - 1 ? '1px solid var(--border-light)' : undefined,
                    }}>
                        <Package style={{ width: 15, height: 15, color: 'var(--text-muted)', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.item_name}</div>
                            {item.notes && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.notes}</div>}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{item.quantity} {item.unit}</div>
                        {item.is_approved ? (
                            <CheckCircle style={{ width: 16, height: 16, color: 'var(--success)' }} />
                        ) : (
                            <XCircle style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
