'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Search, TrendingUp, Calendar, Plus } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';
import type { Expense } from '@/types';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'accent'> = {
    pending: 'warning', approved: 'success', reimbursed: 'accent', denied: 'danger',
};

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const supabase = createClient();
        supabase.from('expenses')
            .select('*, submitter:users!submitted_by(full_name)')
            .order('expense_date', { ascending: false })
            .then(({ data }) => {
                if (data) setExpenses(data as Expense[]);
                setLoading(false);
            });
    }, []);

    const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const filtered = expenses.filter(e =>
        !search || e.description?.toLowerCase().includes(search.toLowerCase()) || e.vendor_payee?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading expenses…</p>
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <div className="page-header-info">
                    <h1>Expenses</h1>
                    <p>Track and manage facility expenditures</p>
                </div>
                <Link href="/dashboard/expenses/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                    <Plus style={{ width: 16, height: 16 }} /> Add Expense
                </Link>
            </div>

            {/* Summary */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div className="card card-pad" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-sm)', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DollarSign style={{ width: 20, height: 20, color: '#D4A843' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(total)}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Expenditure</div>
                    </div>
                </div>
                <div className="card card-pad" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-sm)', background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp style={{ width: 20, height: 20, color: 'var(--success)' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{expenses.length}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Expenses</div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', maxWidth: '320px', marginBottom: '16px' }}>
                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Search expenses…" value={search} onChange={(e) => setSearch(e.target.value)} className="input" style={{ paddingLeft: '36px', fontSize: '13px' }} />
            </div>

            {/* Table */}
            <div className="card" style={{ overflow: 'hidden' }}>
                {filtered.length > 0 ? (
                    <table className="data-table">
                        <thead><tr><th>Description</th><th>Category</th><th>Vendor</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
                        <tbody>
                            {filtered.map((e) => (
                                <tr key={e.id}>
                                    <td>
                                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{e.description}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>by {e.submitter?.full_name}</div>
                                    </td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{e.category?.replace('_', ' ')}</td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{e.vendor_payee || '—'}</td>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(e.amount)}</td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(e.expense_date)}</td>
                                    <td><StatusBadge label={e.status} variant={STATUS_VARIANT[e.status] || 'neutral'} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <EmptyState title="No expenses found" description="No expenses have been recorded yet." />
                )}
            </div>
        </div>
    );
}
