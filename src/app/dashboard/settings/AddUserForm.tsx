'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ROLE_LABELS } from '@/lib/constants';
import type { UserRole } from '@/types';

export default function AddUserForm() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const roles = Object.entries(ROLE_LABELS) as [UserRole, string][];

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
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create user');
            setOpen(false);
            router.refresh();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setSaving(false);
        }
    };

    if (!open) {
        return (
            <button onClick={() => setOpen(true)} className="btn btn-primary">
                <UserPlus style={{ width: 16, height: 16 }} /> Add User
            </button>
        );
    }

    return (
        <div className="card card-pad">
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus style={{ width: 16, height: 16 }} /> Add New User
            </h3>
            {error && <div style={{ padding: '10px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '12px', color: '#DC2626', marginBottom: '12px' }}>{error}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Full Name *</label>
                        <input name="full_name" required className="input" placeholder="John Doe" />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Email *</label>
                        <input name="email" type="email" required className="input" placeholder="john@foundation.org" />
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Password *</label>
                        <input name="password" type="password" required minLength={6} className="input" placeholder="Min 6 characters" />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Role *</label>
                        <select name="role" required className="input">
                            {roles.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                        </select>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">Cancel</button>
                    <button type="submit" disabled={saving} className="btn btn-primary btn-sm">{saving ? 'Creating…' : 'Create User'}</button>
                </div>
            </form>
        </div>
    );
}
