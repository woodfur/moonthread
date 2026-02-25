'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function NewVendorPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const fd = new FormData(e.currentTarget);
        const supabase = createClient();

        // Insert vendor
        const { data: vendor, error: vendorErr } = await supabase.from('vendors').insert({
            company_name: fd.get('company_name') as string,
            service_category: fd.get('service_category') as string,
            rating: parseInt(fd.get('rating') as string) || null,
            notes: fd.get('notes') as string || null,
        }).select().single();

        if (vendorErr) { setError(vendorErr.message); setSaving(false); return; }

        // Insert primary contact if provided
        const contactName = fd.get('contact_name') as string;
        if (contactName && vendor) {
            await supabase.from('vendor_contacts').insert({
                vendor_id: vendor.id,
                name: contactName,
                phone: fd.get('contact_phone') as string || '',
                email: fd.get('contact_email') as string || '',
                is_primary: true,
            });
        }

        router.push('/dashboard/vendors');
        router.refresh();
    };

    const categories = [
        ['cleaning', 'Cleaning Services'],
        ['maintenance', 'Maintenance'],
        ['security', 'Security'],
        ['landscaping', 'Landscaping'],
        ['pest_control', 'Pest Control'],
        ['waste_management', 'Waste Management'],
        ['hvac', 'HVAC'],
        ['electrical', 'Electrical'],
        ['plumbing', 'Plumbing'],
        ['other', 'Other'],
    ];

    return (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <Link href="/dashboard/vendors" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', padding: '8px' }}>
                    <ArrowLeft style={{ width: 18, height: 18 }} />
                </Link>
                <div className="page-header-info">
                    <h1 style={{ fontSize: '22px' }}>Add Vendor</h1>
                    <p>Register a new service provider</p>
                </div>
            </div>

            {error && (
                <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Company Name *</label>
                    <input name="company_name" required className="input" placeholder="e.g. Acme Cleaning Services" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Service Category *</label>
                        <select name="service_category" required className="input">
                            <option value="">Select category…</option>
                            {categories.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Rating (1-5)</label>
                        <input name="rating" type="number" min="1" max="5" className="input" placeholder="e.g. 4" />
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Notes</label>
                    <textarea name="notes" rows={3} className="input" style={{ resize: 'none' }} placeholder="Any additional notes…" />
                </div>

                {/* Primary Contact */}
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>Primary Contact</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Contact Name</label>
                            <input name="contact_name" className="input" placeholder="e.g. John Doe" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Phone</label>
                                <input name="contact_phone" type="tel" className="input" placeholder="+1 555-0123" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Email</label>
                                <input name="contact_email" type="email" className="input" placeholder="john@acme.com" />
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                    <Link href="/dashboard/vendors" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Cancel</Link>
                    <button type="submit" disabled={saving} className="btn btn-primary">
                        <Save style={{ width: 16, height: 16 }} /> {saving ? 'Saving…' : 'Save Vendor'}
                    </button>
                </div>
            </form>
        </div>
    );
}
