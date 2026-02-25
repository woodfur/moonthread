'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { WORK_ORDER_CATEGORY_LABELS } from '@/lib/constants';
import type { WorkOrderCategory, WorkOrderUrgency, FacilityArea } from '@/types';
import { generateWorkOrderNumber } from '@/lib/utils';

export default function NewWorkOrderPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [areas, setAreas] = useState<FacilityArea[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({ location_area: '', category: '' as WorkOrderCategory | '', description: '', urgency: 'medium' as WorkOrderUrgency });

    useEffect(() => {
        const supabase = createClient();
        supabase.from('facility_areas').select('*').order('name').then(({ data }) => {
            if (data) setAreas(data as FacilityArea[]);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError('Not authenticated'); setLoading(false); return; }

        const { error: err } = await supabase.from('work_orders').insert({
            work_order_number: generateWorkOrderNumber(),
            submitted_by: user.id,
            location_area: form.location_area || null,
            category: form.category,
            description: form.description,
            urgency: form.urgency,
            status: 'submitted',
        });

        if (err) { setError(err.message); setLoading(false); }
        else { router.push('/dashboard/work-orders'); router.refresh(); }
    };

    return (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <Link href="/dashboard/work-orders" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', padding: '8px' }}>
                    <ArrowLeft style={{ width: 18, height: 18 }} />
                </Link>
                <div className="page-header-info">
                    <h1 style={{ fontSize: '22px' }}>New Work Order</h1>
                    <p>Submit a maintenance or service request</p>
                </div>
            </div>

            {error && (
                <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Location / Area</label>
                    <select value={form.location_area} onChange={(e) => setForm({ ...form, location_area: e.target.value })} required className="input">
                        <option value="">Select area...</option>
                        {areas.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Issue Category</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as WorkOrderCategory })} required className="input">
                        <option value="">Select category...</option>
                        {Object.entries(WORK_ORDER_CATEGORY_LABELS).map(([k, l]) => (<option key={k} value={k}>{l}</option>))}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Description</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={4} placeholder="Describe the issue in detail..." className="input" style={{ resize: 'none' }} />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>Urgency Level</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                        {(['low', 'medium', 'high', 'emergency'] as WorkOrderUrgency[]).map((level) => (
                            <button key={level} type="button" onClick={() => setForm({ ...form, urgency: level })}
                                style={{
                                    padding: '8px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 500,
                                    textTransform: 'capitalize', cursor: 'pointer', transition: 'all var(--duration) var(--ease)',
                                    border: form.urgency === level ? 'none' : '1px solid var(--border)',
                                    background: form.urgency === level
                                        ? level === 'emergency' ? 'var(--danger)' : level === 'high' ? '#F59E0B' : level === 'medium' ? 'var(--accent)' : 'var(--text-secondary)'
                                        : 'var(--surface)',
                                    color: form.urgency === level ? (level === 'medium' ? 'var(--accent-text)' : '#fff') : 'var(--text-secondary)',
                                }}
                            >{level}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Photo (optional)</label>
                    <div style={{
                        border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)',
                        padding: '28px', textAlign: 'center', cursor: 'pointer',
                        transition: 'border-color var(--duration) var(--ease)',
                    }}>
                        <Upload style={{ width: 20, height: 20, color: 'var(--text-muted)', margin: '0 auto 8px' }} />
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Drop files here or <span style={{ color: 'var(--accent-muted)', fontWeight: 500 }}>click to upload</span></p>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>PNG, JPG up to 5MB</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                    <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ flex: 1 }}>
                        {loading ? 'Submitting...' : 'Submit Work Order'}
                    </button>
                    <Link href="/dashboard/work-orders" className="btn btn-secondary btn-lg" style={{ textDecoration: 'none' }}>Cancel</Link>
                </div>
            </form>
        </div>
    );
}
