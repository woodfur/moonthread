'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { EXPENSE_CATEGORY_LABELS } from '@/lib/constants';
import type { Expense, ExpenseCategory } from '@/types';

export default function EditExpensePage() {
    const { id } = useParams();
    const router = useRouter();
    const [expense, setExpense] = useState<Expense | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const categories = Object.entries(EXPENSE_CATEGORY_LABELS) as [ExpenseCategory, string][];

    useEffect(() => {
        const supabase = createClient();
        supabase.from('expenses').select('*').eq('id', id).single().then(({ data }) => {
            if (data) setExpense(data as Expense);
            setLoading(false);
        });
    }, [id]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        const fd = new FormData(e.currentTarget);
        const supabase = createClient();
        const { error: err } = await supabase.from('expenses').update({
            description: fd.get('description') as string,
            amount: parseFloat(fd.get('amount') as string),
            category: fd.get('category') as string,
            expense_date: fd.get('expense_date') as string,
            vendor_payee: fd.get('vendor_payee') as string || null,
        }).eq('id', id);
        if (err) { setError(err.message); setSaving(false); }
        else { router.push(`/dashboard/expenses/${id}`); router.refresh(); }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}><p style={{ color: 'var(--text-muted)' }}>Loading…</p></div>;
    if (!expense) return <div style={{ textAlign: 'center', padding: '60px' }}><p style={{ color: 'var(--text-muted)' }}>Expense not found</p></div>;

    return (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <Link href={`/dashboard/expenses/${id}`} className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', padding: '8px' }}>
                    <ArrowLeft style={{ width: 18, height: 18 }} />
                </Link>
                <div><h1 style={{ fontSize: '22px' }}>Edit Expense</h1></div>
            </div>
            {error && <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>{error}</div>}
            <form onSubmit={handleSubmit} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Description *</label>
                    <input name="description" required className="input" defaultValue={expense.description} />
                </div>
                <div className="form-row">
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Amount *</label>
                        <input name="amount" type="number" step="0.01" min="0" required className="input" defaultValue={expense.amount} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Category *</label>
                        <select name="category" required className="input" defaultValue={expense.category}>
                            {categories.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </div>
                </div>
                <div className="form-row">
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Date *</label>
                        <input name="expense_date" type="date" required className="input" defaultValue={expense.expense_date} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Vendor / Payee</label>
                        <input name="vendor_payee" className="input" defaultValue={expense.vendor_payee || ''} />
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                    <Link href={`/dashboard/expenses/${id}`} className="btn btn-secondary" style={{ textDecoration: 'none' }}>Cancel</Link>
                    <button type="submit" disabled={saving} className="btn btn-primary"><Save style={{ width: 16, height: 16 }} /> {saving ? 'Saving…' : 'Save Changes'}</button>
                </div>
            </form>
        </div>
    );
}
