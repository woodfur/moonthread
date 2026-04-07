'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Phone, Mail, Star, FileText, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Vendor, VendorContact, Contract, UserRole } from '@/types';

const CONTRACT_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
    active: 'success', expired: 'neutral', under_review: 'warning', terminated: 'danger',
};

export default function VendorDetailPage() {
    const { id } = useParams();
    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [contacts, setContacts] = useState<VendorContact[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<UserRole>('staff');

    useEffect(() => {
        const supabase = createClient();
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: p } = await supabase.from('users').select('role').eq('id', user.id).single();
                setUserRole((p?.role || 'staff') as UserRole);
            }
            const [{ data: v }, { data: c }, { data: ct }] = await Promise.all([
                supabase.from('vendors').select('*').eq('id', id).single(),
                supabase.from('vendor_contacts').select('*').eq('vendor_id', id).order('is_primary', { ascending: false }),
                supabase.from('contracts').select('*').eq('vendor_id', id).order('start_date', { ascending: false }),
            ]);
            if (v) setVendor(v as Vendor);
            if (c) setContacts(c as VendorContact[]);
            if (ct) setContracts(ct as Contract[]);
            setLoading(false);
        }
        load();
    }, [id]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading vendor…</p>
        </div>
    );

    if (!vendor) return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: 'var(--text-muted)' }}>Vendor not found</p>
            <Link href="/dashboard/vendors" className="btn btn-secondary" style={{ marginTop: '16px', textDecoration: 'none' }}>Back to Vendors</Link>
        </div>
    );

    const canManage = userRole === 'admin' || userRole === 'facility_manager';

    return (
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Link href="/dashboard/vendors" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', padding: '8px' }}>
                    <ArrowLeft style={{ width: 18, height: 18 }} />
                </Link>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{vendor.company_name}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{vendor.service_category?.replace('_', ' ')}</span>
                        {vendor.rating && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, color: '#D4A843' }}>
                                <Star style={{ width: 13, height: 13, fill: '#D4A843' }} /> {vendor.rating}/5
                            </span>
                        )}
                    </div>
                </div>
                {canManage && (
                    <Link href={`/dashboard/vendors/${id}/edit`} className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                        <Edit style={{ width: 14, height: 14 }} /> Edit
                    </Link>
                )}
            </div>

            {/* Notes */}
            {vendor.notes && (
                <div className="card card-pad" style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Notes</div>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>{vendor.notes}</p>
                </div>
            )}

            {/* Contacts */}
            <div className="card" style={{ overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Contacts ({contacts.length})</span>
                </div>
                {contacts.length > 0 ? contacts.map((c, idx) => (
                    <div key={c.id} style={{ padding: '14px 24px', borderBottom: idx < contacts.length - 1 ? '1px solid var(--border-light)' : undefined, display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <User style={{ width: 16, height: 16, color: '#D4A843' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                                {c.is_primary && <StatusBadge label="Primary" variant="accent" />}
                            </div>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                                {c.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}><Phone style={{ width: 11, height: 11 }} /> {c.phone}</span>}
                                {c.email && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}><Mail style={{ width: 11, height: 11 }} /> {c.email}</span>}
                            </div>
                        </div>
                    </div>
                )) : (
                    <div style={{ padding: '24px', textAlign: 'center' }}>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No contacts added yet</p>
                    </div>
                )}
            </div>

            {/* Contracts */}
            <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Contracts ({contracts.length})</span>
                    {canManage && (
                        <Link href="/dashboard/vendors/contracts/new" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', fontSize: '12px' }}>+ Add Contract</Link>
                    )}
                </div>
                {contracts.length > 0 ? (
                    <div className="table-responsive"><table className="data-table">
                        <thead><tr><th>Service</th><th>Period</th><th>Value</th><th>Status</th></tr></thead>
                        <tbody>
                            {contracts.map((ct) => (
                                <tr key={ct.id}>
                                    <td style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ct.service_description}</td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(ct.start_date)} – {formatDate(ct.end_date)}</td>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(ct.value)}</td>
                                    <td><StatusBadge label={ct.status} variant={CONTRACT_VARIANT[ct.status] || 'neutral'} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table></div>
                ) : (
                    <EmptyState title="No contracts" description="No contracts have been created for this vendor." />
                )}
            </div>
        </div>
    );
}
