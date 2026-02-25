'use client';

import { useEffect, useState } from 'react';
import { Package, Search, Clock, Plus } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import type { SupplyRequest } from '@/types';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'accent'> = {
    pending: 'warning', approved: 'success', denied: 'danger', ordered: 'accent', received: 'success',
};

export default function SupplyRequestsPage() {
    const [requests, setRequests] = useState<SupplyRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const supabase = createClient();
        async function fetchData() {
            const { data: reqs } = await supabase
                .from('supply_requests')
                .select('*, submitter:users!submitted_by(full_name), area:facility_areas!area_of_use(name)')
                .order('created_at', { ascending: false });
            const { data: items } = await supabase.from('supply_request_items').select('*');

            if (reqs) {
                setRequests(reqs.map(r => ({
                    ...r,
                    items: (items || []).filter(i => i.supply_request_id === r.id),
                })) as SupplyRequest[]);
            }
            setLoading(false);
        }
        fetchData();
    }, []);

    const filtered = requests.filter(r =>
        !search || r.items?.some(i => i.item_name?.toLowerCase().includes(search.toLowerCase())) ||
        r.submitter?.full_name?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading supply requests…</p>
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <div className="page-header-info">
                    <h1>Supply Requests</h1>
                    <p>Track supply orders and inventory needs</p>
                </div>
                <Link href="/dashboard/supply-requests/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                    <Plus style={{ width: 16, height: 16 }} /> New Request
                </Link>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', maxWidth: '320px', marginBottom: '16px' }}>
                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Search requests…" value={search} onChange={(e) => setSearch(e.target.value)} className="input" style={{ paddingLeft: '36px', fontSize: '13px' }} />
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                {[
                    { label: 'Total', value: requests.length },
                    { label: 'Pending', value: requests.filter(r => r.status === 'pending').length, color: '#F59E0B' },
                    { label: 'Approved', value: requests.filter(r => r.status === 'approved').length, color: 'var(--success)' },
                ].map((s) => (
                    <div key={s.label} className="card card-pad" style={{ flex: 1, textAlign: 'center', padding: '12px 16px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: s.color || 'var(--text-primary)' }}>{s.value}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Request Cards */}
            {filtered.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filtered.map((r) => (
                        <div key={r.id} className="card card-pad">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Package style={{ width: 16, height: 16, color: 'var(--accent-muted)' }} />
                                        {r.items?.[0]?.item_name || 'Supply Request'}
                                        {r.items && r.items.length > 1 && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>+{r.items.length - 1} more</span>}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span>by {r.submitter?.full_name}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock style={{ width: 11, height: 11 }} /> {formatRelativeTime(r.created_at)}</span>
                                    </div>
                                </div>
                                <StatusBadge label={r.status} variant={STATUS_VARIANT[r.status] || 'neutral'} />
                            </div>
                            {r.items && r.items.length > 0 && (
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {r.items.map((item, idx) => (
                                        <div key={idx} style={{
                                            fontSize: '11px', padding: '4px 10px', borderRadius: '20px',
                                            background: 'var(--surface-raised)', color: 'var(--text-secondary)',
                                        }}>{item.item_name} × {item.quantity}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card"><EmptyState title="No supply requests" description="No requests have been submitted yet." /></div>
            )}
        </div>
    );
}
