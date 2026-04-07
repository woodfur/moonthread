'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, X } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { WORK_ORDER_CATEGORY_LABELS } from '@/lib/constants';
import type { WorkOrderCategory, WorkOrderUrgency, FacilityArea } from '@/types';
import { generateWorkOrderNumber } from '@/lib/utils';
import FormEntrySelector from '@/components/ui/FormEntrySelector';

export default function NewWorkOrderPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [areas, setAreas] = useState<FacilityArea[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        location_area: '',
        category: '' as WorkOrderCategory | '',
        description: '',
        urgency: 'medium' as WorkOrderUrgency,
    });
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase.from('facility_areas').select('*').order('name').then(({ data }) => {
            if (data) setAreas(data as FacilityArea[]);
        });
    }, []);

    // AI data handler — fills form fields from parsed voice input
    const handleAIData = (data: Record<string, unknown>) => {
        const updates: Partial<typeof form> = {};

        if (data.description) updates.description = data.description as string;
        if (data.category && Object.keys(WORK_ORDER_CATEGORY_LABELS).includes(data.category as string)) {
            updates.category = data.category as WorkOrderCategory;
        }
        if (data.urgency && ['low', 'medium', 'high', 'emergency'].includes(data.urgency as string)) {
            updates.urgency = data.urgency as WorkOrderUrgency;
        }

        // Fuzzy match location_area from AI hint
        if (data.location_hint && areas.length > 0) {
            const hint = (data.location_hint as string).toLowerCase();
            const match = areas.find(a =>
                a.name.toLowerCase().includes(hint) ||
                hint.includes(a.name.toLowerCase())
            );
            if (match) updates.location_area = match.id;
        }

        setForm(prev => ({ ...prev, ...updates }));
    };

    const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        files.forEach((file) => {
            setPhotoFiles((prev) => [...prev, file]);
            const reader = new FileReader();
            reader.onloadend = () => setPreviews((prev) => [...prev, reader.result as string]);
            reader.readAsDataURL(file);
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removePhoto = (index: number) => {
        setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
        setPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError('Not authenticated'); setLoading(false); return; }

        // Upload photos
        const photoUrls: string[] = [];
        for (let i = 0; i < photoFiles.length; i++) {
            const file = photoFiles[i];
            const ext = file.name.split('.').pop() || 'jpg';
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { data: uploadData, error: uploadErr } = await supabase.storage
                .from('work-order-photos')
                .upload(fileName, file, { contentType: file.type });

            if (uploadErr) {
                console.warn('Storage upload failed, using data URL:', uploadErr.message);
                photoUrls.push(previews[i]);
            } else {
                const { data: urlData } = supabase.storage.from('work-order-photos').getPublicUrl(uploadData.path);
                photoUrls.push(urlData.publicUrl);
            }
        }

        const { error: err } = await supabase.from('work_orders').insert({
            work_order_number: generateWorkOrderNumber(),
            submitted_by: user.id,
            location_area: form.location_area || null,
            category: form.category,
            description: form.description,
            urgency: form.urgency,
            status: 'submitted',
            photo_attachments: photoUrls.length > 0 ? photoUrls : null,
        });

        if (err) { setError(err.message); setLoading(false); }
        else { router.push('/dashboard/work-orders'); router.refresh(); }
    };

    return (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <Link href="/dashboard/work-orders" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', padding: '8px' }}>
                    <ArrowLeft style={{ width: 18, height: 18 }} />
                </Link>
                <div className="page-header-info">
                    <h1 style={{ fontSize: '22px' }}>New Work Order</h1>
                    <p>Submit a maintenance or service request</p>
                </div>
            </div>

            {error && (
                <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>
                    {error}
                </div>
            )}

            <FormEntrySelector
                onFormDataExtracted={handleAIData}
                formType="work_order"
                translateToEnglish={true}
                contextHints={{ location_area: areas.map(a => a.name) }}
            >
            <form onSubmit={handleSubmit} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Location / Area</label>
                    <select value={form.location_area} onChange={(e) => setForm({ ...form, location_area: e.target.value })} required className="input">
                        <option value="">Select area...</option>
                        {areas.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Issue Category</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as WorkOrderCategory })} required className="input">
                        <option value="">Select category...</option>
                        {Object.entries(WORK_ORDER_CATEGORY_LABELS).map(([k, l]) => (<option key={k} value={k}>{l}</option>))}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Description</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={4} placeholder="Describe the issue in detail…" className="input" style={{ resize: 'none' }} />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>Urgency Level</label>
                    <div className="grid-4" style={{ gap: '8px' }}>
                        {(['low', 'medium', 'high', 'emergency'] as WorkOrderUrgency[]).map((level) => (
                            <button key={level} type="button" onClick={() => setForm({ ...form, urgency: level })}
                                style={{
                                    padding: '8px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 500,
                                    textTransform: 'capitalize', cursor: 'pointer', transition: 'all var(--duration) var(--ease)',
                                    border: form.urgency === level ? 'none' : '1px solid var(--border)',
                                    background: form.urgency === level
                                        ? level === 'emergency' ? 'var(--danger)' : level === 'high' ? '#F59E0B' : level === 'medium' ? 'var(--accent)' : 'var(--text-secondary)'
                                        : 'var(--surface)',
                                    color: form.urgency === level ? (level === 'medium' ? 'var(--accent-text)' : '#fff') : 'var(--text-secondary)',
                                }}
                            >{level}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Photo (optional)</label>
                    <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: 'none' }} />
                    {previews.length > 0 && (
                        <div className="grid-3" style={{ gap: '10px', marginBottom: '10px' }}>
                            {previews.map((src, i) => (
                                <div key={i} style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                    <img src={src} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
                                    <button type="button" onClick={() => removePhoto(i)}
                                        style={{ position: 'absolute', top: '6px', right: '6px', width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                                        <X style={{ width: 12, height: 12 }} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                        style={{ width: '100%', padding: '24px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: 'border-color var(--duration) var(--ease)' }}
                        onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
                        <Camera style={{ width: 22, height: 22, color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--accent-muted)', fontWeight: 500 }}>Take a photo</span> or choose from gallery
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PNG, JPG up to 5MB</span>
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                    <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ flex: 1 }}>
                        {loading ? 'Submitting...' : 'Submit Work Order'}
                    </button>
                    <Link href="/dashboard/work-orders" className="btn btn-secondary btn-lg" style={{ textDecoration: 'none' }}>Cancel</Link>
                </div>
            </form>
            </FormEntrySelector>
        </div>
    );
}
