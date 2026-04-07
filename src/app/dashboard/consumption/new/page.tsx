'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { CONSUMABLE_CATEGORY_LABELS } from '@/lib/constants';
import type { ConsumableCategory } from '@/types';
import FormEntrySelector from '@/components/ui/FormEntrySelector';

const UNITS = ['bottles', 'packs', 'rolls', 'liters', 'pieces', 'boxes', 'bags', 'gallons', 'cases'];

export default function NewConsumableItemPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Controlled state for all fields
    const [name, setName] = useState('');
    const [category, setCategory] = useState('water');
    const [unit, setUnit] = useState('bottles');
    const [currentStock, setCurrentStock] = useState('0');
    const [reorderThreshold, setReorderThreshold] = useState('5');
    const [notes, setNotes] = useState('');

    // AI handler
    const handleAIData = (data: Record<string, unknown>) => {
        if (data.name) setName(data.name as string);
        if (data.category && Object.keys(CONSUMABLE_CATEGORY_LABELS).includes(data.category as string)) {
            setCategory(data.category as string);
        }
        if (data.unit && UNITS.includes(data.unit as string)) {
            setUnit(data.unit as string);
        }
        if (data.current_stock !== undefined) setCurrentStock(String(data.current_stock));
        if (data.reorder_threshold !== undefined) setReorderThreshold(String(data.reorder_threshold));
        if (data.notes) setNotes(data.notes as string);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const supabase = createClient();

        const { error: insertErr } = await supabase.from('consumable_items').insert({
            name,
            category,
            unit,
            current_stock: parseInt(currentStock) || 0,
            reorder_threshold: parseInt(reorderThreshold) || 5,
            notes: notes || null,
        });

        if (insertErr) { setError(insertErr.message); setSaving(false); return; }

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
                    <h1 style={{ fontSize: '22px' }}>Add Consumable Item</h1>
                    <p>Register a new supply item to track</p>
                </div>
            </div>

            {error && (
                <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>
                    {error}
                </div>
            )}

            <FormEntrySelector
                onFormDataExtracted={handleAIData}
                formType="consumable_new"
                translateToEnglish={true}
            >
            <form onSubmit={handleSubmit} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Name */}
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Item Name *</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} required className="input" placeholder="e.g. Dispenser Water 18.9L" style={{ fontSize: '13px' }} />
                </div>

                <div className="form-row">
                    {/* Category */}
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Category *</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} required className="input">
                            {(Object.entries(CONSUMABLE_CATEGORY_LABELS) as [ConsumableCategory, string][]).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                            ))}
                        </select>
                    </div>
                    {/* Unit */}
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Unit *</label>
                        <select value={unit} onChange={(e) => setUnit(e.target.value)} required className="input">
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    {/* Initial Stock */}
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Initial Stock</label>
                        <input value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} type="number" min="0" className="input" style={{ fontSize: '13px' }} />
                    </div>
                    {/* Reorder Threshold */}
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Reorder Threshold</label>
                        <input value={reorderThreshold} onChange={(e) => setReorderThreshold(e.target.value)} type="number" min="0" className="input" style={{ fontSize: '13px' }} />
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Alert when stock is at or below this</div>
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Notes</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="input"
                        placeholder="Optional description…"
                        style={{ fontSize: '13px', resize: 'vertical' }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                    <Link href="/dashboard/consumption" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Cancel</Link>
                    <button type="submit" disabled={saving} className="btn btn-primary">
                        <Save style={{ width: 16, height: 16 }} /> {saving ? 'Saving…' : 'Save Item'}
                    </button>
                </div>
            </form>
            </FormEntrySelector>
        </div>
    );
}
