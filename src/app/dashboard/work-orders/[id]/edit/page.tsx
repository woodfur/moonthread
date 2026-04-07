'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { WORK_ORDER_CATEGORY_LABELS, URGENCY_LABELS } from '@/lib/constants';
import type { WorkOrder, WorkOrderCategory, WorkOrderUrgency, FacilityArea } from '@/types';

export default function EditWorkOrderPage() {
    const { id } = useParams();
    const router = useRouter();
    const [wo, setWo] = useState<WorkOrder | null>(null);
    const [areas, setAreas] = useState<FacilityArea[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const categories = Object.entries(WORK_ORDER_CATEGORY_LABELS) as [WorkOrderCategory, string][];
    const urgencies = Object.entries(URGENCY_LABELS) as [WorkOrderUrgency, string][];

    useEffect(() => {
        const supabase = createClient();
        async function load() {
            const [{ data: w }, { data: a }] = await Promise.all([
                supabase.from('work_orders').select('*').eq('id', id).single(),
                supabase.from('facility_areas').select('*').order('name'),
            ]);
            if (w) setWo(w as WorkOrder);
            if (a) setAreas(a as FacilityArea[]);
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
        const { error: err } = await supabase.from('work_orders').update({
            description: fd.get('description') as string,
            category: fd.get('category') as string,
            urgency: fd.get('urgency') as string,
            location_area: fd.get('location_area') as string || null,
        }).eq('id', id);
        if (err) { setError(err.message); setSaving(false); }
        else { router.push(`/dashboard/work-orders/${id}`); router.refresh(); }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}><p style={{ color: 'var(--text-muted)' }}>Loading…</p></div>;
    if (!wo) return <div style={{ textAlign: 'center', padding: '60px' }}><p style={{ color: 'var(--text-muted)' }}>Work order not found</p></div>;

    return (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <Link href={`/dashboard/work-orders/${id}`} className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', padding: '8px' }}>
                    <ArrowLeft style={{ width: 18, height: 18 }} />
                </Link>
                <div><h1 style={{ fontSize: '22px' }}>Edit Work Order</h1><p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{wo.work_order_number}</p></div>
            </div>
            {error && <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>{error}</div>}
            <form onSubmit={handleSubmit} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Description *</label>
                    <textarea name="description" required rows={4} className="input" defaultValue={wo.description} style={{ resize: 'none' }} />
                </div>
                <div className="form-row">
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Category *</label>
                        <select name="category" required className="input" defaultValue={wo.category}>
                            {categories.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Urgency *</label>
                        <select name="urgency" required className="input" defaultValue={wo.urgency}>
                            {urgencies.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Location</label>
                    <select name="location_area" className="input" defaultValue={wo.location_area || ''}>
                        <option value="">Select area</option>
                        {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                    <Link href={`/dashboard/work-orders/${id}`} className="btn btn-secondary" style={{ textDecoration: 'none' }}>Cancel</Link>
                    <button type="submit" disabled={saving} className="btn btn-primary"><Save style={{ width: 16, height: 16 }} /> {saving ? 'Saving…' : 'Save Changes'}</button>
                </div>
            </form>
        </div>
    );
}
