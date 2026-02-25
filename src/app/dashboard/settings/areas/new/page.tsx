'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function NewAreaSettingsPage() {
    const router = useRouter();
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
            is_bookable: fd.get('is_bookable') === 'true',
        });

        if (err) { setError(err.message); setSaving(false); }
        else { router.push('/dashboard/settings'); router.refresh(); }
    };

    const areaTypes = ['office', 'meeting_room', 'common_area', 'storage', 'restroom', 'kitchen', 'parking', 'lobby', 'outdoor', 'other'];

    return (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <Link href="/dashboard/settings" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', padding: '8px' }}>
                    <ArrowLeft style={{ width: 18, height: 18 }} />
                </Link>
                <div className="page-header-info">
                    <h1 style={{ fontSize: '22px' }}>Add Area</h1>
                    <p>Define a new facility area</p>
                </div>
            </div>

            {error && (
                <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Area Name *</label>
                    <input name="name" required className="input" placeholder="e.g. Conference Room A" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Type *</label>
                        <select name="type" required className="input">
                            <option value="">Select type…</option>
                            {areaTypes.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Capacity *</label>
                        <input name="capacity" type="number" min="0" required className="input" placeholder="e.g. 50" />
                    </div>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Key Features</label>
                    <textarea name="key_features" rows={2} className="input" style={{ resize: 'none' }} placeholder="e.g. Projector, whiteboard, AC" />
                </div>
                <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <input name="is_bookable" type="checkbox" value="true" defaultChecked />
                        This area is bookable
                    </label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                    <Link href="/dashboard/settings" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Cancel</Link>
                    <button type="submit" disabled={saving} className="btn btn-primary">
                        <Save style={{ width: 16, height: 16 }} /> {saving ? 'Saving…' : 'Save Area'}
                    </button>
                </div>
            </form>
        </div>
    );
}
