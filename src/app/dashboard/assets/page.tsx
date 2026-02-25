'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import DeleteAssetButton from './DeleteAssetButton';
import { ASSET_CATEGORY_LABELS, ASSET_CONDITION_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import type { Asset, AssetCategory, UserRole } from '@/types';

const CONDITION_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'accent'> = {
    excellent: 'success', good: 'accent', fair: 'warning', poor: 'danger', decommissioned: 'neutral',
};

export default function AssetsPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<AssetCategory | ''>('');
    const [userRole, setUserRole] = useState<UserRole>('staff');

    useEffect(() => {
        const supabase = createClient();

        async function fetchData() {
            // Get user role
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
                setUserRole((profile?.role || user.user_metadata?.role || 'staff') as UserRole);
            }

            // Get assets
            const { data } = await supabase.from('assets').select('*, area:facility_areas!location_area(name)').order('name');
            if (data) setAssets(data as Asset[]);
            setLoading(false);
        }
        fetchData();
    }, []);

    const canAdd = ['admin', 'facility_manager', 'cleaning_supervisor'].includes(userRole);
    const canDelete = ['admin', 'facility_manager'].includes(userRole);

    const filtered = assets.filter((a) => {
        if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.serial_number?.toLowerCase().includes(search.toLowerCase())) return false;
        if (categoryFilter && a.category !== categoryFilter) return false;
        return true;
    });

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading assets…</p>
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <div className="page-header-info">
                    <h1>Assets & Equipment</h1>
                    <p>Track and manage all facility assets</p>
                </div>
                <Link href="/dashboard/assets/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                    <Plus style={{ width: 16, height: 16 }} /> Add Asset
                </Link>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-muted)' }} />
                    <input type="text" placeholder="Search assets…" value={search} onChange={(e) => setSearch(e.target.value)} className="input" style={{ paddingLeft: '36px', fontSize: '13px' }} />
                </div>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as AssetCategory | '')} className="input" style={{ width: '180px', fontSize: '13px' }}>
                    <option value="">All Categories</option>
                    {Object.entries(ASSET_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {filtered.length} asset{filtered.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Asset Cards */}
            {filtered.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {filtered.map((asset) => (
                        <div key={asset.id} className="card" style={{ overflow: 'hidden' }}>
                            {/* Asset Image */}
                            <div style={{
                                height: '130px', background: 'var(--surface-raised)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderBottom: '1px solid var(--border-light)', overflow: 'hidden',
                            }}>
                                {asset.image_url ? (
                                    <img src={asset.image_url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <ImageIcon style={{ width: 32, height: 32, color: 'var(--text-muted)' }} />
                                )}
                            </div>

                            <div className="card-pad">
                                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '14px' }}>
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{asset.name}</div>
                                        <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', marginTop: '2px' }}>{asset.serial_number}</div>
                                    </div>
                                    <StatusBadge label={ASSET_CONDITION_LABELS[asset.condition]} variant={CONDITION_VARIANT[asset.condition]} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {[
                                        ['Category', ASSET_CATEGORY_LABELS[asset.category]],
                                        ['Location', asset.area?.name || '—'],
                                        ['Quantity', String(asset.quantity || 1)],
                                        ['Purchased', asset.purchase_date ? formatDate(asset.purchase_date) : '—'],
                                    ].map(([label, value]) => (
                                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                                            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
                                        </div>
                                    ))}
                                </div>
                                {canDelete && (
                                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-light)' }}>
                                        <DeleteAssetButton assetId={asset.id} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card">
                    <EmptyState title="No assets found" description={search || categoryFilter ? 'Try adjusting your search or filter.' : canAdd ? 'Add your first asset to start tracking.' : 'No assets have been added yet.'} />
                </div>
            )}
        </div>
    );
}
