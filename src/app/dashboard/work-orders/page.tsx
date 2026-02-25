'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, AlertTriangle, Search, Filter } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { WORK_ORDER_STATUS_LABELS, URGENCY_LABELS, WORK_ORDER_CATEGORY_LABELS } from '@/lib/constants';
import { formatRelativeTime } from '@/lib/utils';
import type { WorkOrder, WorkOrderStatus } from '@/types';

const STATUS_VARIANT: Record<string, 'accent' | 'success' | 'warning' | 'danger' | 'neutral'> = {
    submitted: 'accent', pending_approval: 'warning', approved: 'success',
    in_progress: 'accent', completed: 'success', rejected: 'danger', on_hold: 'neutral',
};
const URGENCY_VARIANT: Record<string, 'accent' | 'success' | 'warning' | 'danger' | 'neutral'> = {
    low: 'neutral', medium: 'accent', high: 'warning', emergency: 'danger',
};

export default function WorkOrdersPage() {
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | ''>('');

    useEffect(() => {
        const supabase = createClient();
        supabase.from('work_orders')
            .select('*, submitter:users!submitted_by(full_name), area:facility_areas!location_area(name)')
            .order('created_at', { ascending: false })
            .then(({ data }) => {
                if (data) setWorkOrders(data as WorkOrder[]);
                setLoading(false);
            });
    }, []);

    const filtered = workOrders.filter((wo) => {
        if (search && !wo.description.toLowerCase().includes(search.toLowerCase()) && !wo.work_order_number.toLowerCase().includes(search.toLowerCase())) return false;
        if (statusFilter && wo.status !== statusFilter) return false;
        return true;
    });

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading work orders…</p>
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <div className="page-header-info">
                    <h1>Work Orders</h1>
                    <p>Manage maintenance requests and track progress</p>
                </div>
                <Link href="/dashboard/work-orders/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                    <Plus style={{ width: 16, height: 16 }} /> New Work Order
                </Link>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-muted)' }} />
                    <input type="text" placeholder="Search work orders…" value={search} onChange={(e) => setSearch(e.target.value)} className="input" style={{ paddingLeft: '36px', fontSize: '13px' }} />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as WorkOrderStatus | '')} className="input" style={{ width: '160px', fontSize: '13px' }}>
                    <option value="">All Statuses</option>
                    {Object.entries(WORK_ORDER_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
            </div>

            {/* Stats Strip */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                {[
                    { label: 'Total', value: workOrders.length, color: 'var(--text-primary)' },
                    { label: 'Open', value: workOrders.filter(w => ['submitted', 'approved', 'in_progress'].includes(w.status)).length, color: 'var(--accent-muted)' },
                    { label: 'Pending', value: workOrders.filter(w => w.status === 'pending_approval').length, color: '#F59E0B' },
                    { label: 'Completed', value: workOrders.filter(w => w.status === 'completed').length, color: 'var(--success)' },
                ].map((s) => (
                    <div key={s.label} className="card card-pad" style={{ flex: 1, textAlign: 'center', padding: '12px 16px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="card" style={{ overflow: 'hidden' }}>
                {filtered.length > 0 ? (
                    <table className="data-table">
                        <thead>
                            <tr><th>ID</th><th>Description</th><th>Location</th><th>Category</th><th>Urgency</th><th>Status</th><th>Submitted</th></tr>
                        </thead>
                        <tbody>
                            {filtered.map((wo) => (
                                <tr key={wo.id} style={{ cursor: 'pointer' }}>
                                    <td><span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 500, color: 'var(--accent-muted)' }}>{wo.work_order_number}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {wo.urgency === 'emergency' && <AlertTriangle style={{ width: 14, height: 14, color: 'var(--danger)', flexShrink: 0 }} />}
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{wo.description}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>by {wo.submitter?.full_name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{wo.area?.name || '—'}</td>
                                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{WORK_ORDER_CATEGORY_LABELS[wo.category]}</td>
                                    <td><StatusBadge label={URGENCY_LABELS[wo.urgency]} variant={URGENCY_VARIANT[wo.urgency]} /></td>
                                    <td><StatusBadge label={WORK_ORDER_STATUS_LABELS[wo.status]} variant={STATUS_VARIANT[wo.status]} /></td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatRelativeTime(wo.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <EmptyState title="No work orders found" description={search || statusFilter ? 'Try adjusting your filters.' : 'Submit your first work order to get started.'} />
                )}
            </div>
        </div>
    );
}
