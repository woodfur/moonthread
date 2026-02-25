'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { EXPENSE_CATEGORY_LABELS } from '@/lib/constants';
import type { ExpenseCategory } from '@/types';

export default function NewExpensePage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const fd = new FormData(e.currentTarget);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError('Not authenticated'); setSaving(false); return; }

        const { error: err } = await supabase.from('expenses').insert({
            submitted_by: user.id,
            description: fd.get('description') as string,
            amount: parseFloat(fd.get('amount') as string) || 0,
            category: fd.get('category') as string,
            expense_date: fd.get('expense_date') as string,
            vendor_payee: fd.get('vendor_payee') as string || '',
            status: 'pending',
        });

        if (err) { setError(err.message); setSaving(false); }
        else { router.push('/dashboard/expenses'); router.refresh(); }
    };

    return (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <Link href="/dashboard/expenses" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', padding: '8px' }}>
                    <ArrowLeft style={{ width: 18, height: 18 }} />
                </Link>
                <div className="page-header-info">
                    <h1 style={{ fontSize: '22px' }}>Add Expense</h1>
                    <p>Record a facility expenditure</p>
                </div>
            </div>

            {error && (
                <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Description *</label>
                    <input name="description" required className="input" placeholder="e.g. Monthly cleaning supplies purchase" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Amount *</label>
                        <input name="amount" type="number" step="0.01" min="0" required className="input" placeholder="0.00" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Category *</label>
                        <select name="category" required className="input">
                            <option value="">Select category…</option>
                            {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                        </select>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Expense Date *</label>
                        <input name="expense_date" type="date" required className="input" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Vendor / Payee</label>
                        <input name="vendor_payee" className="input" placeholder="e.g. Office Depot" />
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                    <Link href="/dashboard/expenses" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Cancel</Link>
                    <button type="submit" disabled={saving} className="btn btn-primary">
                        <Save style={{ width: 16, height: 16 }} /> {saving ? 'Saving…' : 'Save Expense'}
                    </button>
                </div>
            </form>
        </div>
    );
}
