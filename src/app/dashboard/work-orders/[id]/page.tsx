'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, AlertTriangle, MapPin, Clock, User, Camera } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/components/auth/AuthProvider';
import { WORK_ORDER_STATUS_LABELS, URGENCY_LABELS, WORK_ORDER_CATEGORY_LABELS } from '@/lib/constants';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import type { WorkOrder, WorkOrderStatus, UserRole } from '@/types';

const STATUS_VARIANT: Record<string, 'accent' | 'success' | 'warning' | 'danger' | 'neutral'> = {
    submitted: 'accent', pending_approval: 'warning', approved: 'success',
    in_progress: 'accent', completed: 'success', rejected: 'danger', on_hold: 'neutral',
};
const URGENCY_VARIANT: Record<string, 'accent' | 'success' | 'warning' | 'danger' | 'neutral'> = {
    low: 'neutral', medium: 'accent', high: 'warning', emergency: 'danger',
};

const NEXT_STATUSES: Record<string, { label: string; status: WorkOrderStatus; variant: string }[]> = {
    submitted: [
        { label: 'Approve', status: 'approved', variant: 'success' },
        { label: 'Reject', status: 'rejected', variant: 'danger' },
    ],
    pending_approval: [
        { label: 'Approve', status: 'approved', variant: 'success' },
        { label: 'Reject', status: 'rejected', variant: 'danger' },
    ],
    approved: [
        { label: 'Start Work', status: 'in_progress', variant: 'accent' },
        { label: 'Put On Hold', status: 'on_hold', variant: 'neutral' },
    ],
    in_progress: [
        { label: 'Complete', status: 'completed', variant: 'success' },
        { label: 'Put On Hold', status: 'on_hold', variant: 'neutral' },
    ],
    on_hold: [
        { label: 'Resume', status: 'in_progress', variant: 'accent' },
    ],
};

export default function WorkOrderDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [wo, setWo] = useState<WorkOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const { role } = useAuth();
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const supabase = createClient();
        async function load() {
            const { data } = await supabase.from('work_orders')
                .select('*, submitter:users!submitted_by(full_name, email), area:facility_areas!location_area(name)')
                .eq('id', id)
                .single();
            if (data) setWo(data as WorkOrder);
            setLoading(false);
        }
        load();
    }, [id]);

    const handleStatusChange = async (newStatus: WorkOrderStatus) => {
        if (!wo) return;
        setUpdating(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const updateData: Record<string, unknown> = { status: newStatus };
        if (newStatus === 'approved') {
            updateData.approved_by = user?.id;
            updateData.approved_at = new Date().toISOString();
        }
        if (newStatus === 'completed') {
            updateData.completed_at = new Date().toISOString();
        }
        const { error } = await supabase.from('work_orders').update(updateData).eq('id', wo.id);
        if (!error) {
            setWo({ ...wo, status: newStatus } as WorkOrder);
        }
        setUpdating(false);
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading work order…</p>
        </div>
    );

    if (!wo) return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: 'var(--text-muted)' }}>Work order not found</p>
            <Link href="/dashboard/work-orders" className="btn btn-secondary" style={{ marginTop: '16px', textDecoration: 'none' }}>Back to Work Orders</Link>
        </div>
    );

    const canManage = role === 'admin' || role === 'facility_manager';
    const actions = canManage ? (NEXT_STATUSES[wo.status] || []) : [];

    return (
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Link href="/dashboard/work-orders" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', padding: '8px' }}>
                    <ArrowLeft style={{ width: 18, height: 18 }} />
                </Link>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, color: 'var(--accent-muted)' }}>{wo.work_order_number}</span>
                        <StatusBadge label={WORK_ORDER_STATUS_LABELS[wo.status]} variant={STATUS_VARIANT[wo.status]} />
                        <StatusBadge label={URGENCY_LABELS[wo.urgency]} variant={URGENCY_VARIANT[wo.urgency]} />
                    </div>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>Work Order Details</h1>
                </div>
                {canManage && (
                    <Link href={`/dashboard/work-orders/${id}/edit`} className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                        <Edit style={{ width: 14, height: 14 }} /> Edit
                    </Link>
                )}
            </div>

            {/* Status Actions */}
            {actions.length > 0 && (
                <div className="card card-pad" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-raised)' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginRight: 'auto' }}>Actions:</span>
                    {actions.map((a) => (
                        <button
                            key={a.status}
                            onClick={() => handleStatusChange(a.status)}
                            disabled={updating}
                            className={`btn btn-sm`}
                            style={{
                                background: a.variant === 'success' ? 'var(--success)' : a.variant === 'danger' ? 'var(--danger)' : a.variant === 'accent' ? 'var(--accent)' : 'var(--surface)',
                                color: a.variant === 'accent' ? 'var(--accent-text)' : '#fff',
                                border: 'none',
                            }}
                        >
                            {a.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Main Info Card */}
            <div className="card" style={{ overflow: 'hidden', marginBottom: '16px' }}>
                {/* Description */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Description</div>
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6 }}>{wo.description}</p>
                </div>

                {/* Details Grid */}
                <div className="form-row" style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ padding: '16px 24px', borderRight: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            <MapPin style={{ width: 12, height: 12 }} /> Location
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{wo.area?.name || '—'}</div>
                    </div>
                    <div style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            <AlertTriangle style={{ width: 12, height: 12 }} /> Category
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{WORK_ORDER_CATEGORY_LABELS[wo.category]}</div>
                    </div>
                </div>

                <div className="form-row" style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ padding: '16px 24px', borderRight: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            <User style={{ width: 12, height: 12 }} /> Submitted By
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{wo.submitter?.full_name || '—'}</div>
                    </div>
                    <div style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            <Clock style={{ width: 12, height: 12 }} /> Submitted
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{formatDate(wo.created_at)}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatRelativeTime(wo.created_at)}</div>
                    </div>
                </div>

                {/* Timestamps */}
                {(wo.approved_at || wo.completed_at) && (
                    <div className="form-row">
                        {wo.approved_at && (
                            <div style={{ padding: '16px 24px', borderRight: wo.completed_at ? '1px solid var(--border-light)' : undefined }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Approved</div>
                                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--success)' }}>{formatDate(wo.approved_at)}</div>
                            </div>
                        )}
                        {wo.completed_at && (
                            <div style={{ padding: '16px 24px' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Completed</div>
                                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--success)' }}>{formatDate(wo.completed_at)}</div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Photos */}
            {wo.photo_attachments && wo.photo_attachments.length > 0 && (
                <div className="card card-pad" style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                        <Camera style={{ width: 14, height: 14 }} /> Photos ({wo.photo_attachments.length})
                    </div>
                    <div className="grid-3" style={{ gap: '10px' }}>
                        {wo.photo_attachments.map((url, i) => (
                            <div key={i} style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                <img src={url} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Rejection Reason */}
            {wo.status === 'rejected' && wo.rejection_reason && (
                <div className="card card-pad" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--danger)', marginBottom: '6px' }}>Rejection Reason</div>
                    <p style={{ fontSize: '13px', color: '#991B1B', lineHeight: 1.5 }}>{wo.rejection_reason}</p>
                </div>
            )}
        </div>
    );
}
