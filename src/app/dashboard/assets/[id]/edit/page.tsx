'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ASSET_CATEGORY_LABELS } from '@/lib/constants';
import type { Asset, AssetCategory, AssetCondition, FacilityArea } from '@/types';

const conditions: { value: AssetCondition; label: string }[] = [
    { value: 'excellent', label: 'Excellent' }, { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' }, { value: 'poor', label: 'Poor' },
    { value: 'decommissioned', label: 'Decommissioned' },
];

export default function EditAssetPage() {
    const { id } = useParams();
    const router = useRouter();
    const [asset, setAsset] = useState<Asset | null>(null);
    const [areas, setAreas] = useState<FacilityArea[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const categories = Object.entries(ASSET_CATEGORY_LABELS) as [AssetCategory, string][];

    useEffect(() => {
        const supabase = createClient();
        async function load() {
            const [{ data: a }, { data: ar }] = await Promise.all([
                supabase.from('assets').select('*').eq('id', id).single(),
                supabase.from('facility_areas').select('*').order('name'),
            ]);
            if (a) setAsset(a as Asset);
            if (ar) setAreas(ar as FacilityArea[]);
            setLoading(false);
        }
        load();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        const fd = new FormData(e.currentTarget);
        const supabase = createClient();
        const { error: err } = await supabase.from('assets').update({
            name: fd.get('name') as string,
            category: fd.get('category') as string,
            condition: fd.get('condition') as string,
            location_area: fd.get('location_area') as string || null,
            serial_number: fd.get('serial_number') as string || null,
            quantity: parseInt(fd.get('quantity') as string) || 1,
        }).eq('id', id);
        if (err) { setError(err.message); setSaving(false); }
        else { router.push(`/dashboard/assets/${id}`); router.refresh(); }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}><p style={{ color: 'var(--text-muted)' }}>Loading…</p></div>;
    if (!asset) return <div style={{ textAlign: 'center', padding: '60px' }}><p style={{ color: 'var(--text-muted)' }}>Asset not found</p></div>;

    return (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <Link href={`/dashboard/assets/${id}`} className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', padding: '8px' }}>
                    <ArrowLeft style={{ width: 18, height: 18 }} />
                </Link>
                <div><h1 style={{ fontSize: '22px' }}>Edit Asset</h1><p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{asset.name}</p></div>
            </div>
            {error && <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>{error}</div>}
            <form onSubmit={handleSubmit} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Asset Name *</label>
                    <input name="name" required className="input" defaultValue={asset.name} />
                </div>
                <div className="form-row">
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Category *</label>
                        <select name="category" required className="input" defaultValue={asset.category}>
                            {categories.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Condition *</label>
                        <select name="condition" required className="input" defaultValue={asset.condition}>
                            {conditions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Location / Area</label>
                    <select name="location_area" className="input" defaultValue={asset.location_area || ''}>
                        <option value="">Select area (optional)</option>
                        {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>
                <div className="form-row">
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Serial Number</label>
                        <input name="serial_number" className="input" defaultValue={asset.serial_number || ''} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Quantity</label>
                        <input name="quantity" type="number" min="1" className="input" defaultValue={asset.quantity || 1} />
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                    <Link href={`/dashboard/assets/${id}`} className="btn btn-secondary" style={{ textDecoration: 'none' }}>Cancel</Link>
                    <button type="submit" disabled={saving} className="btn btn-primary"><Save style={{ width: 16, height: 16 }} /> {saving ? 'Saving…' : 'Save Changes'}</button>
                </div>
            </form>
        </div>
    );
}
