'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, DollarSign, Calendar, Tag, User, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import StatusBadge from '@/components/ui/StatusBadge';
import { EXPENSE_CATEGORY_LABELS } from '@/lib/constants';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Expense, ExpenseStatus, UserRole } from '@/types';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'accent'> = {
    pending: 'warning', approved: 'success', rejected: 'danger', clarification_requested: 'accent',
};

const NEXT_STATUSES: Record<string, { label: string; status: ExpenseStatus; variant: string }[]> = {
    pending: [
        { label: 'Approve', status: 'approved', variant: 'success' },
        { label: 'Reject', status: 'rejected', variant: 'danger' },
        { label: 'Request Clarification', status: 'clarification_requested', variant: 'accent' },
    ],
    clarification_requested: [
        { label: 'Approve', status: 'approved', variant: 'success' },
        { label: 'Reject', status: 'rejected', variant: 'danger' },
    ],
};

export default function ExpenseDetailPage() {
    const { id } = useParams();
    const [expense, setExpense] = useState<Expense | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<UserRole>('staff');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const supabase = createClient();
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: p } = await supabase.from('users').select('role').eq('id', user.id).single();
                setUserRole((p?.role || 'staff') as UserRole);
            }
            const { data } = await supabase.from('expenses')
                .select('*, submitter:users!submitted_by(full_name, email)')
                .eq('id', id)
                .single();
            if (data) setExpense(data as Expense);
            setLoading(false);
        }
        load();
    }, [id]);

    const handleStatusChange = async (newStatus: ExpenseStatus) => {
        if (!expense) return;
        setUpdating(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from('expenses')
            .update({ status: newStatus, approved_by: user?.id })
            .eq('id', expense.id);
        if (!error) setExpense({ ...expense, status: newStatus });
        setUpdating(false);
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading expense…</p>
        </div>
    );

    if (!expense) return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: 'var(--text-muted)' }}>Expense not found</p>
            <Link href="/dashboard/expenses" className="btn btn-secondary" style={{ marginTop: '16px', textDecoration: 'none' }}>Back to Expenses</Link>
        </div>
    );

    const canManage = userRole === 'admin';
    const actions = canManage ? (NEXT_STATUSES[expense.status] || []) : [];

    return (
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Link href="/dashboard/expenses" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', padding: '8px' }}>
                    <ArrowLeft style={{ width: 18, height: 18 }} />
                </Link>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>Expense Details</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <StatusBadge label={expense.status.replace('_', ' ')} variant={STATUS_VARIANT[expense.status] || 'neutral'} />
                    </div>
                </div>
                {canManage && (
                    <Link href={`/dashboard/expenses/${id}/edit`} className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                        <Edit style={{ width: 14, height: 14 }} /> Edit
                    </Link>
                )}
            </div>

            {/* Status Actions */}
            {actions.length > 0 && (
                <div className="card card-pad" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-raised)' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginRight: 'auto' }}>Actions:</span>
                    {actions.map((a) => (
                        <button key={a.status} onClick={() => handleStatusChange(a.status)} disabled={updating}
                            className="btn btn-sm"
                            style={{
                                background: a.variant === 'success' ? 'var(--success)' : a.variant === 'danger' ? 'var(--danger)' : 'var(--accent)',
                                color: a.variant === 'accent' ? 'var(--accent-text)' : '#fff', border: 'none',
                            }}
                        >{a.label}</button>
                    ))}
                </div>
            )}

            {/* Amount Card */}
            <div className="card card-pad" style={{ marginBottom: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(expense.amount)}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{expense.description}</div>
            </div>

            {/* Details */}
            <div className="card" style={{ overflow: 'hidden', marginBottom: '16px' }}>
                {[
                    { icon: Tag, label: 'Category', value: EXPENSE_CATEGORY_LABELS[expense.category]?.replace('_', ' ') || expense.category },
                    { icon: Calendar, label: 'Date', value: formatDate(expense.expense_date) },
                    { icon: FileText, label: 'Vendor / Payee', value: expense.vendor_payee || '—' },
                    { icon: User, label: 'Submitted By', value: expense.submitter?.full_name || '—' },
                    { icon: DollarSign, label: 'Amount', value: formatCurrency(expense.amount) },
                ].map((item, idx, arr) => (
                    <div key={item.label} style={{
                        display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 24px',
                        borderBottom: idx < arr.length - 1 ? '1px solid var(--border-light)' : undefined,
                    }}>
                        <item.icon style={{ width: 15, height: 15, color: 'var(--text-muted)', flexShrink: 0 }} />
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '100px' }}>{item.label}</div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.value}</div>
                    </div>
                ))}
            </div>

            {/* Receipt */}
            {expense.receipt_attachment && (
                <div className="card card-pad">
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>Receipt</div>
                    <img src={expense.receipt_attachment} alt="Receipt" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} />
                </div>
            )}

            {expense.rejection_reason && (
                <div className="card card-pad" style={{ marginTop: '16px', background: '#FEF2F2', border: '1px solid #FECACA' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--danger)', marginBottom: '6px' }}>Rejection Reason</div>
                    <p style={{ fontSize: '13px', color: '#991B1B' }}>{expense.rejection_reason}</p>
                </div>
            )}
        </div>
    );
}
