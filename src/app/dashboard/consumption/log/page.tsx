'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { ConsumableItem, FacilityArea } from '@/types';
import FormEntrySelector from '@/components/ui/FormEntrySelector';

export default function LogConsumptionPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [items, setItems] = useState<ConsumableItem[]>([]);
    const [areas, setAreas] = useState<FacilityArea[]>([]);
    const [selectedItem, setSelectedItem] = useState<ConsumableItem | null>(null);

    // Controlled fields
    const [itemId, setItemId] = useState('');
    const [action, setAction] = useState('consumed');
    const [quantity, setQuantity] = useState('1');
    const [areaId, setAreaId] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        const supabase = createClient();
        Promise.all([
            supabase.from('consumable_items').select('*').eq('is_active', true).order('name'),
            supabase.from('facility_areas').select('*').order('name'),
        ]).then(([{ data: itemsData }, { data: areasData }]) => {
            if (itemsData) setItems(itemsData as ConsumableItem[]);
            if (areasData) setAreas(areasData as FacilityArea[]);
        });
    }, []);

    const handleItemChange = (id: string) => {
        setItemId(id);
        const item = items.find(i => i.id === id) || null;
        setSelectedItem(item);
    };

    // AI handler — fuzzy match item, set action, quantity, notes
    const handleAIData = (data: Record<string, unknown>) => {
        if (data.item_hint && items.length > 0) {
            const hint = (data.item_hint as string).toLowerCase();
            const match = items.find(i =>
                i.name.toLowerCase().includes(hint) ||
                hint.includes(i.name.toLowerCase())
            );
            if (match) {
                setItemId(match.id);
                setSelectedItem(match);
            }
        }
        if (data.action && ['consumed', 'restocked'].includes(data.action as string)) {
            setAction(data.action as string);
        }
        if (data.quantity) setQuantity(String(data.quantity));
        if (data.notes) setNotes(data.notes as string);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError('Not authenticated'); setSaving(false); return; }

        const qty = parseInt(quantity) || 1;

        // Validate: can't consume more than current stock
        if (action === 'consumed' && selectedItem && qty > selectedItem.current_stock) {
            setError(`Cannot consume ${qty} — only ${selectedItem.current_stock} in stock.`);
            setSaving(false);
            return;
        }

        // Insert log entry
        const { error: logErr } = await supabase.from('consumption_logs').insert({
            item_id: itemId,
            logged_by: user.id,
            action,
            quantity: qty,
            area_id: areaId || null,
            notes: notes || null,
        });
        if (logErr) { setError(logErr.message); setSaving(false); return; }

        // Update stock level
        const stockDelta = action === 'consumed' ? -qty : qty;
        const newStock = (selectedItem?.current_stock ?? 0) + stockDelta;
        const { error: updateErr } = await supabase
            .from('consumable_items')
            .update({ current_stock: Math.max(0, newStock), updated_at: new Date().toISOString() })
            .eq('id', itemId);
        if (updateErr) { setError(updateErr.message); setSaving(false); return; }

        router.push('/dashboard/consumption');
        router.refresh();
    };

    return (
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <Link href="/dashboard/consumption" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', padding: '8px' }}>
                    <ArrowLeft style={{ width: 18, height: 18 }} />
                </Link>
                <div className="page-header-info">
                    <h1 style={{ fontSize: '22px' }}>Log Consumption</h1>
                    <p>Record supply usage or restocking</p>
                </div>
            </div>

            {error && (
                <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>
                    {error}
                </div>
            )}

            <FormEntrySelector
                onFormDataExtracted={handleAIData}
                formType="consumption_log"
                translateToEnglish={true}
                contextHints={{ item_hint: items.map(i => i.name) }}
            >
            <form onSubmit={handleSubmit} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Item Selection */}
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Select Item *</label>
                    <select value={itemId} onChange={(e) => handleItemChange(e.target.value)} required className="input">
                        <option value="">Choose an item…</option>
                        {items.map(i => (
                            <option key={i.id} value={i.id}>{i.name} ({i.current_stock} {i.unit} in stock)</option>
                        ))}
                    </select>
                </div>

                {/* Current stock indicator */}
                {selectedItem && (
                    <div style={{
                        padding: '12px 16px', borderRadius: 'var(--radius-md)',
                        background: selectedItem.current_stock <= selectedItem.reorder_threshold ? 'var(--warning-light)' : 'var(--surface-raised)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Current Stock</span>
                        <span style={{
                            fontSize: '16px', fontWeight: 700,
                            color: selectedItem.current_stock <= selectedItem.reorder_threshold ? '#D97706' : 'var(--text-primary)',
                        }}>
                            {selectedItem.current_stock} {selectedItem.unit}
                        </span>
                    </div>
                )}

                <div className="form-row">
                    {/* Action */}
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Action *</label>
                        <select value={action} onChange={(e) => setAction(e.target.value)} required className="input">
                            <option value="consumed">Consumed (used up)</option>
                            <option value="restocked">Restocked (added)</option>
                        </select>
                    </div>
                    {/* Quantity */}
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Quantity *</label>
                        <input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" min="1" required className="input" style={{ fontSize: '13px' }} />
                    </div>
                </div>

                {/* Area */}
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Area / Location</label>
                    <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className="input">
                        <option value="">Select area (optional)…</option>
                        {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>

                {/* Notes */}
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Notes</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="input"
                        placeholder="e.g. Replaced water dispenser on 3rd floor"
                        style={{ fontSize: '13px', resize: 'vertical' }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                    <Link href="/dashboard/consumption" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Cancel</Link>
                    <button type="submit" disabled={saving} className="btn btn-primary">
                        <Save style={{ width: 16, height: 16 }} /> {saving ? 'Saving…' : 'Log Entry'}
                    </button>
                </div>
            </form>
            </FormEntrySelector>
        </div>
    );
}
