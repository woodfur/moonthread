'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Camera, X } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ASSET_CATEGORY_LABELS } from '@/lib/constants';
import type { AssetCategory, AssetCondition } from '@/types';

export default function NewAssetPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const removePhoto = () => {
        setPreview(null);
        setPhotoFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const fd = new FormData(e.currentTarget);
        const supabase = createClient();

        let image_url: string | null = null;

        // Upload photo to Supabase Storage if provided
        if (photoFile) {
            const ext = photoFile.name.split('.').pop() || 'jpg';
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { data: uploadData, error: uploadErr } = await supabase.storage
                .from('asset-images')
                .upload(fileName, photoFile, { contentType: photoFile.type });

            if (uploadErr) {
                // If storage bucket doesn't exist, store as data URL fallback
                console.warn('Storage upload failed, using data URL:', uploadErr.message);
                image_url = preview;
            } else {
                const { data: urlData } = supabase.storage.from('asset-images').getPublicUrl(uploadData.path);
                image_url = urlData.publicUrl;
            }
        }

        const { error: err } = await supabase.from('assets').insert({
            name: fd.get('name') as string,
            category: fd.get('category') as string,
            location_area: fd.get('location_area') as string || null,
            serial_number: fd.get('serial_number') as string,
            purchase_date: fd.get('purchase_date') as string || null,
            condition: fd.get('condition') as string,
            quantity: parseInt(fd.get('quantity') as string) || 1,
            image_url,
            responsible_party: null,
        });

        if (err) {
            setError(err.message);
            setSaving(false);
        } else {
            router.push('/dashboard/assets');
            router.refresh();
        }
    };

    const categories = Object.entries(ASSET_CATEGORY_LABELS) as [AssetCategory, string][];
    const conditions: { value: AssetCondition; label: string }[] = [
        { value: 'excellent', label: 'Excellent' },
        { value: 'good', label: 'Good' },
        { value: 'fair', label: 'Fair' },
        { value: 'poor', label: 'Poor' },
    ];

    return (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Link href="/dashboard/assets" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
                    <ArrowLeft style={{ width: 16, height: 16 }} />
                </Link>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Add New Asset</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Enter asset details to add to inventory</p>
                </div>
            </div>

            {error && (
                <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Asset Name *</label>
                    <input name="name" required className="input" placeholder="e.g. Industrial Floor Scrubber" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Category *</label>
                        <select name="category" required className="input">
                            <option value="">Select category</option>
                            {categories.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Condition *</label>
                        <select name="condition" required className="input">
                            {conditions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Serial Number</label>
                        <input name="serial_number" className="input" placeholder="e.g. CLN-2023-008" />
                    </div>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Quantity *</label>
                        <input name="quantity" type="number" min="1" defaultValue="1" required className="input" />
                    </div>
                </div>

                <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Purchase Date</label>
                    <input name="purchase_date" type="date" className="input" />
                </div>

                {/* Photo Capture */}
                <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Photo</label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhoto}
                        style={{ display: 'none' }}
                    />
                    {preview ? (
                        <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <img src={preview} alt="Asset preview" style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} />
                            <button
                                type="button"
                                onClick={removePhoto}
                                style={{
                                    position: 'absolute', top: '8px', right: '8px',
                                    width: 28, height: 28, borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.6)', border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: '#fff',
                                }}
                            >
                                <X style={{ width: 14, height: 14 }} />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                width: '100%', padding: '28px', border: '2px dashed var(--border)',
                                borderRadius: 'var(--radius-md)', background: 'transparent',
                                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                                alignItems: 'center', gap: '8px',
                                transition: 'border-color var(--duration) var(--ease)',
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                        >
                            <Camera style={{ width: 24, height: 24, color: 'var(--text-muted)' }} />
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                <span style={{ color: 'var(--accent-muted)', fontWeight: 500 }}>Take a photo</span> or choose from gallery
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PNG, JPG up to 5MB</span>
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                    <Link href="/dashboard/assets" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Cancel</Link>
                    <button type="submit" disabled={saving} className="btn btn-primary">
                        <Save style={{ width: 16, height: 16 }} /> {saving ? 'Saving…' : 'Save Asset'}
                    </button>
                </div>
            </form>
        </div>
    );
}
