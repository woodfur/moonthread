'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { FacilityArea } from '@/types';

export default function NewSupplyRequestPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [areas, setAreas] = useState<FacilityArea[]>([]);
    const [items, setItems] = useState([{ item_name: '', quantity: 1, unit: 'pieces', notes: '' }]);

    useEffect(() => {
        const supabase = createClient();
        supabase.from('facility_areas').select('*').order('name').then(({ data }) => {
            if (data) setAreas(data as FacilityArea[]);
        });
    }, []);

    const addItem = () => setItems([...items, { item_name: '', quantity: 1, unit: 'pieces', notes: '' }]);
    const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
    const updateItem = (idx: number, field: string, value: string | number) => {
        const updated = [...items];
        (updated[idx] as Record<string, string | number>)[field] = value;
        setItems(updated);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const fd = new FormData(e.currentTarget);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError('Not authenticated'); setSaving(false); return; }

        const { data: req, error: reqErr } = await supabase.from('supply_requests').insert({
            submitted_by: user.id,
            area_of_use: fd.get('area_of_use') as string || null,
            priority: fd.get('priority') as string,
            status: 'pending',
        }).select().single();

        if (reqErr) { setError(reqErr.message); setSaving(false); return; }

        // Insert items
        const validItems = items.filter(i => i.item_name.trim());
        if (validItems.length > 0 && req) {
            const { error: itemsErr } = await supabase.from('supply_request_items').insert(
                validItems.map(i => ({
                    supply_request_id: req.id,
                    item_name: i.item_name,
                    quantity: i.quantity,
                    unit: i.unit,
                    notes: i.notes || null,
                    is_approved: false,
                }))
            );
            if (itemsErr) { setError(itemsErr.message); setSaving(false); return; }
        }

        router.push('/dashboard/supply-requests');
        router.refresh();
    };

    return (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <Link href="/dashboard/supply-requests" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', padding: '8px' }}>
                    <ArrowLeft style={{ width: 18, height: 18 }} />
                </Link>
                <div className="page-header-info">
                    <h1 style={{ fontSize: '22px' }}>New Supply Request</h1>
                    <p>Request supplies or materials</p>
                </div>
            </div>

            {error && (
                <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Area of Use</label>
                        <select name="area_of_use" className="input">
                            <option value="">Select area…</option>
                            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Priority *</label>
                        <select name="priority" required className="input">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                </div>

                {/* Items */}
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Items</h3>
                        <button type="button" onClick={addItem} className="btn btn-ghost btn-sm" style={{ gap: '4px', fontSize: '12px' }}>
                            <Plus style={{ width: 14, height: 14 }} /> Add Item
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {items.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'end' }}>
                                <div style={{ flex: 2 }}>
                                    {idx === 0 && <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>Item Name</label>}
                                    <input value={item.item_name} onChange={(e) => updateItem(idx, 'item_name', e.target.value)} required className="input" placeholder="e.g. Paper towels" style={{ fontSize: '13px' }} />
                                </div>
                                <div style={{ flex: 0, minWidth: '70px' }}>
                                    {idx === 0 && <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>Qty</label>}
                                    <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} className="input" style={{ fontSize: '13px' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    {idx === 0 && <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>Unit</label>}
                                    <select value={item.unit} onChange={(e) => updateItem(idx, 'unit', e.target.value)} className="input" style={{ fontSize: '13px' }}>
                                        {['pieces', 'boxes', 'cases', 'gallons', 'liters', 'rolls', 'bags', 'packs'].map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                                {items.length > 1 && (
                                    <button type="button" onClick={() => removeItem(idx)} style={{ padding: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--danger)' }}>
                                        <Trash2 style={{ width: 14, height: 14 }} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                    <Link href="/dashboard/supply-requests" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Cancel</Link>
                    <button type="submit" disabled={saving} className="btn btn-primary">
                        <Save style={{ width: 16, height: 16 }} /> {saving ? 'Submitting…' : 'Submit Request'}
                    </button>
                </div>
            </form>
        </div>
    );
}
