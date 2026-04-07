'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Camera, X } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Vendor } from '@/types';

export default function NewContractPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [preview, setPreview] = useState<string | null>(null);
    const [docFile, setDocFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase.from('vendors').select('id, company_name').order('company_name').then(({ data }) => {
            if (data) setVendors(data as Vendor[]);
        });
    }, []);

    const handleDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setDocFile(file);
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => setPreview(reader.result as string);
                reader.readAsDataURL(file);
            } else {
                setPreview(null);
            }
        }
    };

    const removeDoc = () => {
        setPreview(null);
        setDocFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const fd = new FormData(e.currentTarget);
        const supabase = createClient();

        let document_attachment: string | null = null;

        if (docFile) {
            const ext = docFile.name.split('.').pop() || 'jpg';
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { data: uploadData, error: uploadErr } = await supabase.storage
                .from('contract-documents')
                .upload(fileName, docFile, { contentType: docFile.type });

            if (uploadErr) {
                console.warn('Storage upload failed, using data URL:', uploadErr.message);
                if (preview) document_attachment = preview;
            } else {
                const { data: urlData } = supabase.storage.from('contract-documents').getPublicUrl(uploadData.path);
                document_attachment = urlData.publicUrl;
            }
        }

        const { error: err } = await supabase.from('contracts').insert({
            vendor_id: fd.get('vendor_id') as string,
            service_description: fd.get('service_description') as string,
            start_date: fd.get('start_date') as string,
            end_date: fd.get('end_date') as string,
            renewal_date: fd.get('renewal_date') as string || null,
            value: parseFloat(fd.get('value') as string) || 0,
            status: 'active',
            document_attachment,
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
                <div className="form-row">
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Start Date *</label>
                        <input name="start_date" type="date" required className="input" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>End Date *</label>
                        <input name="end_date" type="date" required className="input" />
                    </div>
                </div>
                <div className="form-row">
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Contract Value *</label>
                        <input name="value" type="number" step="0.01" min="0" required className="input" placeholder="0.00" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Renewal Date</label>
                        <input name="renewal_date" type="date" className="input" />
                    </div>
                </div>

                {/* Document / Receipt Upload */}
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Receipt / Document <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '11px' }}>(optional)</span></label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        capture="environment"
                        onChange={handleDoc}
                        style={{ display: 'none' }}
                    />
                    {docFile ? (
                        <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                            {preview ? (
                                <img src={preview} alt="Document preview" style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
                            ) : (
                                <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface)' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{docFile.name}</span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({(docFile.size / 1024).toFixed(0)} KB)</span>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={removeDoc}
                                style={{
                                    position: 'absolute', top: '6px', right: '6px',
                                    width: 24, height: 24, borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.6)', border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: '#fff',
                                }}
                            >
                                <X style={{ width: 12, height: 12 }} />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                width: '100%', padding: '24px', border: '2px dashed var(--border)',
                                borderRadius: 'var(--radius-md)', background: 'transparent',
                                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                                alignItems: 'center', gap: '6px',
                                transition: 'border-color var(--duration) var(--ease)',
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                        >
                            <Camera style={{ width: 22, height: 22, color: 'var(--text-muted)' }} />
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                <span style={{ color: 'var(--accent-muted)', fontWeight: 500 }}>Take a photo</span> or upload a document
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PNG, JPG, PDF up to 5MB</span>
                        </button>
                    )}
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
