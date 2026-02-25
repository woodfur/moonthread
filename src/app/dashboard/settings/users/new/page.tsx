'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ROLE_LABELS } from '@/lib/constants';
import type { UserRole } from '@/types';

export default function NewUserPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const fd = new FormData(e.currentTarget);
        const email = fd.get('email') as string;
        const password = fd.get('password') as string;
        const full_name = fd.get('full_name') as string;
        const role = fd.get('role') as string;

        try {
            const res = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, full_name, role }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create user');
            }

            router.push('/dashboard/settings');
            router.refresh();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create user');
            setSaving(false);
        }
    };

    return (
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <Link href="/dashboard/settings" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', padding: '8px' }}>
                    <ArrowLeft style={{ width: 18, height: 18 }} />
                </Link>
                <div className="page-header-info">
                    <h1 style={{ fontSize: '22px' }}>Add User</h1>
                    <p>Create a new user account</p>
                </div>
            </div>

            {error && (
                <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Full Name *</label>
                    <input name="full_name" required className="input" placeholder="e.g. Jane Smith" />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Email Address *</label>
                    <input name="email" type="email" required className="input" placeholder="jane@example.com" />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Password *</label>
                    <input name="password" type="password" required minLength={6} className="input" placeholder="Minimum 6 characters" />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Role *</label>
                    <select name="role" required className="input">
                        {Object.entries(ROLE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                    <Link href="/dashboard/settings" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Cancel</Link>
                    <button type="submit" disabled={saving} className="btn btn-primary">
                        <Save style={{ width: 16, height: 16 }} /> {saving ? 'Creating…' : 'Create User'}
                    </button>
                </div>
            </form>
        </div>
    );
}
