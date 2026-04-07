'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Vendor } from '@/types';

export default function EditVendorPage() {
    const { id } = useParams();
    const router = useRouter();
    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();
        supabase.from('vendors').select('*').eq('id', id).single().then(({ data }) => {
            if (data) setVendor(data as Vendor);
            setLoading(false);
        });
    }, [id]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        const fd = new FormData(e.currentTarget);
        const supabase = createClient();
        const { error: err } = await supabase.from('vendors').update({
            company_name: fd.get('company_name') as string,
            service_category: fd.get('service_category') as string,
            rating: parseInt(fd.get('rating') as string) || null,
            notes: fd.get('notes') as string || null,
        }).eq('id', id);
        if (err) { setError(err.message); setSaving(false); }
        else { router.push(`/dashboard/vendors/${id}`); router.refresh(); }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}><p style={{ color: 'var(--text-muted)' }}>Loading…</p></div>;
    if (!vendor) return <div style={{ textAlign: 'center', padding: '60px' }}><p style={{ color: 'var(--text-muted)' }}>Vendor not found</p></div>;

    return (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <Link href={`/dashboard/vendors/${id}`} className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', padding: '8px' }}>
                    <ArrowLeft style={{ width: 18, height: 18 }} />
                </Link>
                <div><h1 style={{ fontSize: '22px' }}>Edit Vendor</h1><p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{vendor.company_name}</p></div>
            </div>
            {error && <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>{error}</div>}
            <form onSubmit={handleSubmit} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Company Name *</label>
                    <input name="company_name" required className="input" defaultValue={vendor.company_name} />
                </div>
                <div className="form-row">
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Service Category</label>
                        <input name="service_category" className="input" defaultValue={vendor.service_category || ''} placeholder="e.g. plumbing, electrical" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Rating (1–5)</label>
                        <select name="rating" className="input" defaultValue={vendor.rating || ''}>
                            <option value="">No rating</option>
                            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Notes</label>
                    <textarea name="notes" rows={3} className="input" defaultValue={vendor.notes || ''} style={{ resize: 'none' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                    <Link href={`/dashboard/vendors/${id}`} className="btn btn-secondary" style={{ textDecoration: 'none' }}>Cancel</Link>
                    <button type="submit" disabled={saving} className="btn btn-primary"><Save style={{ width: 16, height: 16 }} /> {saving ? 'Saving…' : 'Save Changes'}</button>
                </div>
            </form>
        </div>
    );
}
