'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, MapPin, Tag, Hash, Calendar, Package, Wrench } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import StatusBadge from '@/components/ui/StatusBadge';
import { ASSET_CATEGORY_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import type { Asset, UserRole } from '@/types';

const CONDITION_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'accent'> = {
    excellent: 'success', good: 'accent', fair: 'warning', poor: 'danger', decommissioned: 'neutral',
};

export default function AssetDetailPage() {
    const { id } = useParams();
    const [asset, setAsset] = useState<Asset | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<UserRole>('staff');

    useEffect(() => {
        const supabase = createClient();
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: p } = await supabase.from('users').select('role').eq('id', user.id).single();
                setUserRole((p?.role || 'staff') as UserRole);
            }
            const { data } = await supabase.from('assets')
                .select('*, area:facility_areas!location_area(name)')
                .eq('id', id)
                .single();
            if (data) setAsset(data as Asset);
            setLoading(false);
        }
        load();
    }, [id]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading asset…</p>
        </div>
    );

    if (!asset) return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: 'var(--text-muted)' }}>Asset not found</p>
            <Link href="/dashboard/assets" className="btn btn-secondary" style={{ marginTop: '16px', textDecoration: 'none' }}>Back to Assets</Link>
        </div>
    );

    const canManage = userRole === 'admin' || userRole === 'facility_manager';

    return (
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Link href="/dashboard/assets" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', padding: '8px' }}>
                    <ArrowLeft style={{ width: 18, height: 18 }} />
                </Link>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{asset.name}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <StatusBadge label={ASSET_CATEGORY_LABELS[asset.category] || asset.category} variant="accent" />
                        <StatusBadge label={asset.condition} variant={CONDITION_VARIANT[asset.condition] || 'neutral'} />
                    </div>
                </div>
                {canManage && (
                    <Link href={`/dashboard/assets/${id}/edit`} className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                        <Edit style={{ width: 14, height: 14 }} /> Edit
                    </Link>
                )}
            </div>

            {/* Image */}
            {asset.image_url && (
                <div className="card" style={{ overflow: 'hidden', marginBottom: '16px' }}>
                    <img src={asset.image_url} alt={asset.name} style={{ width: '100%', height: '280px', objectFit: 'cover', display: 'block' }} />
                </div>
            )}

            {/* Details */}
            <div className="card" style={{ overflow: 'hidden', marginBottom: '16px' }}>
                {[
                    { icon: MapPin, label: 'Location', value: asset.area?.name || '—' },
                    { icon: Hash, label: 'Serial Number', value: asset.serial_number || '—' },
                    { icon: Package, label: 'Quantity', value: String(asset.quantity || 1) },
                    { icon: Calendar, label: 'Purchase Date', value: asset.purchase_date ? formatDate(asset.purchase_date) : '—' },
                    { icon: Tag, label: 'Category', value: ASSET_CATEGORY_LABELS[asset.category] || asset.category },
                    { icon: Wrench, label: 'Condition', value: asset.condition },
                ].map((item, idx, arr) => (
                    <div key={item.label} style={{
                        display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 24px',
                        borderBottom: idx < arr.length - 1 ? '1px solid var(--border-light)' : undefined,
                    }}>
                        <item.icon style={{ width: 15, height: 15, color: 'var(--text-muted)', flexShrink: 0 }} />
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '100px' }}>{item.label}</div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{item.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
