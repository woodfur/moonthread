'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, Search, Phone, Mail, MapPin, Globe, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Vendor, Contract } from '@/types';

export default function VendorsPage() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState<'vendors' | 'contracts'>('vendors');

    useEffect(() => {
        const supabase = createClient();
        async function fetchData() {
            const { data: v } = await supabase.from('vendors').select('*').order('company_name');
            const { data: vc } = await supabase.from('vendor_contacts').select('*');
            const { data: c } = await supabase.from('contracts').select('*, vendor:vendors!vendor_id(company_name)').order('start_date', { ascending: false });

            if (v) setVendors(v.map(vendor => ({
                ...vendor,
                contacts: (vc || []).filter(contact => contact.vendor_id === vendor.id),
            })) as Vendor[]);
            if (c) setContracts(c as Contract[]);
            setLoading(false);
        }
        fetchData();
    }, []);

    const filteredVendors = vendors.filter(v => !search || v.company_name.toLowerCase().includes(search.toLowerCase()));
    const filteredContracts = contracts.filter(c => !search || c.service_description?.toLowerCase().includes(search.toLowerCase()));

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading vendors…</p>
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <div className="page-header-info">
                    <h1>Vendors & Contracts</h1>
                    <p>Manage service providers and agreements</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Link href="/dashboard/vendors/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                        <Plus style={{ width: 16, height: 16 }} /> Add Vendor
                    </Link>
                    <Link href="/dashboard/vendors/contracts/new" className="btn btn-outline" style={{ textDecoration: 'none' }}>
                        <Plus style={{ width: 16, height: 16 }} /> Add Contract
                    </Link>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
                {(['vendors', 'contracts'] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)} style={{
                        padding: '10px 20px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                        border: 'none', background: 'transparent',
                        color: tab === t ? 'var(--accent-muted)' : 'var(--text-muted)',
                        borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                        textTransform: 'capitalize', transition: 'all var(--duration) var(--ease)',
                    }}>{t} ({t === 'vendors' ? vendors.length : contracts.length})</button>
                ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', maxWidth: '320px', marginBottom: '16px' }}>
                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-muted)' }} />
                <input type="text" placeholder={`Search ${tab}…`} value={search} onChange={(e) => setSearch(e.target.value)} className="input" style={{ paddingLeft: '36px', fontSize: '13px' }} />
            </div>

            {tab === 'vendors' ? (
                filteredVendors.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        {filteredVendors.map((v) => (
                            <div key={v.id} className="card card-pad">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '14px' }}>
                                    <div>
                                        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{v.company_name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{v.service_category?.replace('_', ' ')}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '2px' }}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star key={star} style={{ width: 13, height: 13, fill: star <= (v.rating || 0) ? '#F6CE71' : 'none', color: star <= (v.rating || 0) ? '#F6CE71' : 'var(--border)' }} />
                                        ))}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    {v.contacts && v.contacts[0] && (
                                        <>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone style={{ width: 12, height: 12 }} /> {v.contacts[0].phone}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail style={{ width: 12, height: 12 }} /> {v.contacts[0].email}</div>
                                        </>
                                    )}
                                    {v.notes && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin style={{ width: 12, height: 12 }} /> {v.notes}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <div className="card"><EmptyState title="No vendors found" /></div>
            ) : (
                filteredContracts.length > 0 ? (
                    <div className="card" style={{ overflow: 'hidden' }}>
                        <table className="data-table">
                            <thead><tr><th>Title</th><th>Vendor</th><th>Value</th><th>Start</th><th>End</th><th>Status</th></tr></thead>
                            <tbody>
                                {filteredContracts.map((c) => (
                                    <tr key={c.id}>
                                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.service_description}</td>
                                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.vendor?.company_name}</td>
                                        <td style={{ fontWeight: 500 }}>{formatCurrency(c.value)}</td>
                                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(c.start_date)}</td>
                                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(c.end_date)}</td>
                                        <td><StatusBadge label={c.status} variant={c.status === 'active' ? 'success' : c.status === 'expired' ? 'danger' : 'neutral'} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <div className="card"><EmptyState title="No contracts found" /></div>
            )}
        </div>
    );
}
