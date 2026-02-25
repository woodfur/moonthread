'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { FacilityArea } from '@/types';

export default function NewBookingPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [areas, setAreas] = useState<FacilityArea[]>([]);

    useEffect(() => {
        const supabase = createClient();
        supabase.from('facility_areas').select('*').eq('is_bookable', true).order('name').then(({ data }) => {
            if (data) setAreas(data as FacilityArea[]);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const fd = new FormData(e.currentTarget);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError('Not authenticated'); setSaving(false); return; }

        const { error: err } = await supabase.from('space_bookings').insert({
            facility_area_id: fd.get('facility_area_id') as string,
            requested_by: user.id,
            booking_date: fd.get('booking_date') as string,
            start_time: fd.get('start_time') as string,
            end_time: fd.get('end_time') as string,
            purpose: fd.get('purpose') as string,
            expected_attendees: parseInt(fd.get('expected_attendees') as string) || 1,
            setup_requirements: fd.get('setup_requirements') as string || null,
            status: 'pending',
        });

        if (err) { setError(err.message); setSaving(false); }
        else { router.push('/dashboard/spaces'); router.refresh(); }
    };

    return (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <Link href="/dashboard/spaces" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', padding: '8px' }}>
                    <ArrowLeft style={{ width: 18, height: 18 }} />
                </Link>
                <div className="page-header-info">
                    <h1 style={{ fontSize: '22px' }}>New Booking</h1>
                    <p>Reserve a facility space</p>
                </div>
            </div>

            {error && (
                <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Space *</label>
                    <select name="facility_area_id" required className="input">
                        <option value="">Select space…</option>
                        {areas.map((a) => <option key={a.id} value={a.id}>{a.name} (cap. {a.capacity})</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Purpose *</label>
                    <input name="purpose" required className="input" placeholder="e.g. Team meeting, training session" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Date *</label>
                        <input name="booking_date" type="date" required className="input" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Start Time *</label>
                        <input name="start_time" type="time" required className="input" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>End Time *</label>
                        <input name="end_time" type="time" required className="input" />
                    </div>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Expected Attendees *</label>
                    <input name="expected_attendees" type="number" min="1" defaultValue="1" required className="input" />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Setup Requirements</label>
                    <textarea name="setup_requirements" rows={2} className="input" style={{ resize: 'none' }} placeholder="e.g. Projector, chairs in U-shape" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                    <Link href="/dashboard/spaces" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Cancel</Link>
                    <button type="submit" disabled={saving} className="btn btn-primary">
                        <Save style={{ width: 16, height: 16 }} /> {saving ? 'Submitting…' : 'Submit Booking'}
                    </button>
                </div>
            </form>
        </div>
    );
}
