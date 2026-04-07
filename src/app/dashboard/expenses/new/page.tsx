'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { EXPENSE_CATEGORY_LABELS } from '@/lib/constants';
import type { ExpenseCategory } from '@/types';
import FormEntrySelector from '@/components/ui/FormEntrySelector';

export default function NewExpensePage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Controlled form fields
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [expenseDate, setExpenseDate] = useState('');
    const [vendorPayee, setVendorPayee] = useState('');

    const handleAIData = (data: Record<string, unknown>) => {
        if (data.description) setDescription(data.description as string);
        if (data.amount) setAmount(String(data.amount));
        if (data.category && Object.keys(EXPENSE_CATEGORY_LABELS).includes(data.category as string)) {
            setCategory(data.category as string);
        }
        if (data.expense_date) setExpenseDate(data.expense_date as string);
        if (data.vendor_payee) setVendorPayee(data.vendor_payee as string);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError('Not authenticated'); setSaving(false); return; }

        const { error: err } = await supabase.from('expenses').insert({
            submitted_by: user.id,
            description,
            amount: parseFloat(amount) || 0,
            category,
            expense_date: expenseDate,
            vendor_payee: vendorPayee || '',
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

            <FormEntrySelector
                onFormDataExtracted={handleAIData}
                formType="expense"
                translateToEnglish={true}
            >
                <form onSubmit={handleSubmit} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Description *</label>
                        <input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            className="input"
                            placeholder="e.g. Monthly cleaning supplies purchase"
                        />
                    </div>
                    <div className="form-row">
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Amount *</label>
                            <input value={amount} onChange={(e) => setAmount(e.target.value)} name="amount" type="number" step="0.01" min="0" required className="input" placeholder="0.00" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Category *</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)} name="category" required className="input">
                                <option value="">Select category…</option>
                                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Expense Date *</label>
                            <input value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} name="expense_date" type="date" required className="input" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Vendor / Payee</label>
                            <input value={vendorPayee} onChange={(e) => setVendorPayee(e.target.value)} name="vendor_payee" className="input" placeholder="e.g. Office Depot" />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                        <Link href="/dashboard/expenses" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Cancel</Link>
                        <button type="submit" disabled={saving} className="btn btn-primary">
                            <Save style={{ width: 16, height: 16 }} /> {saving ? 'Saving…' : 'Save Expense'}
                        </button>
                    </div>
                </form>
            </FormEntrySelector>
        </div>
    );
}
