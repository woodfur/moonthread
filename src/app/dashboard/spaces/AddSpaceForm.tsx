'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AddSpaceForm() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const fd = new FormData(e.currentTarget);
        const supabase = createClient();

        const { error: err } = await supabase.from('facility_areas').insert({
            name: fd.get('name') as string,
            type: fd.get('type') as string,
            capacity: parseInt(fd.get('capacity') as string) || 0,
            key_features: fd.get('key_features') as string || '',
            is_bookable: fd.get('is_bookable') === 'on',
        });

        if (err) {
            setError(err.message);
            setSaving(false);
        } else {
            setOpen(false);
            setSaving(false);
            router.refresh();
        }
    };

    if (!open) {
        return (
            <button onClick={() => setOpen(true)} className="btn btn-secondary" style={{ marginBottom: '8px' }}>
                <Plus style={{ width: 16, height: 16 }} /> Add New Space
            </button>
        );
    }

    return (
        <div className="card card-pad" style={{ marginBottom: '8px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>Add New Space</h3>
            {error && <div style={{ padding: '10px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '12px', color: '#DC2626', marginBottom: '12px' }}>{error}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input name="name" required className="input" placeholder="Space name" />
                    <input name="type" required className="input" placeholder="Type (e.g. Event / Assembly)" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                    <input name="capacity" type="number" min="0" className="input" placeholder="Capacity" />
                    <input name="key_features" className="input" placeholder="Key features (comma separated)" />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <input name="is_bookable" type="checkbox" defaultChecked style={{ accentColor: '#F6CE71' }} /> Bookable
                </label>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">Cancel</button>
                    <button type="submit" disabled={saving} className="btn btn-primary btn-sm">{saving ? 'Saving…' : 'Save Space'}</button>
                </div>
            </form>
        </div>
    );
}
