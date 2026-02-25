'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Vendor } from '@/types';

export default function NewContractPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [vendors, setVendors] = useState<Vendor[]>([]);

    useEffect(() => {
        const supabase = createClient();
        supabase.from('vendors').select('id, company_name').order('company_name').then(({ data }) => {
            if (data) setVendors(data as Vendor[]);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const fd = new FormData(e.currentTarget);
        const supabase = createClient();

        const { error: err } = await supabase.from('contracts').insert({
            vendor_id: fd.get('vendor_id') as string,
            service_description: fd.get('service_description') as string,
            start_date: fd.get('start_date') as string,
            end_date: fd.get('end_date') as string,
            renewal_date: fd.get('renewal_date') as string || null,
            value: parseFloat(fd.get('value') as string) || 0,
            status: 'active',
        });

        if (err) { setError(err.message); setSaving(false); }
        else { router.push('/dashboard/vendors'); router.refresh(); }
    };

    return (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <Link href="/dashboard/vendors" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', padding: '8px' }}>
                    <ArrowLeft style={{ width: 18, height: 18 }} />
                </Link>
                <div className="page-header-info">
                    <h1 style={{ fontSize: '22px' }}>Add Contract</h1>
                    <p>Create a new vendor agreement</p>
                </div>
            </div>

            {error && (
                <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Vendor *</label>
                    <select name="vendor_id" required className="input">
                        <option value="">Select vendor…</option>
                        {vendors.map((v) => <option key={v.id} value={v.id}>{v.company_name}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Service Description *</label>
                    <textarea name="service_description" required rows={3} className="input" style={{ resize: 'none' }} placeholder="Describe the contracted services…" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Start Date *</label>
                        <input name="start_date" type="date" required className="input" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>End Date *</label>
                        <input name="end_date" type="date" required className="input" />
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Contract Value *</label>
                        <input name="value" type="number" step="0.01" min="0" required className="input" placeholder="0.00" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Renewal Date</label>
                        <input name="renewal_date" type="date" className="input" />
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                    <Link href="/dashboard/vendors" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Cancel</Link>
                    <button type="submit" disabled={saving} className="btn btn-primary">
                        <Save style={{ width: 16, height: 16 }} /> {saving ? 'Saving…' : 'Save Contract'}
                    </button>
                </div>
            </form>
        </div>
    );
}
