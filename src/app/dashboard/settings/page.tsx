'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Settings2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import AddUserForm from './AddUserForm';
import { ROLE_LABELS } from '@/lib/constants';
import type { User, FacilityArea, UserRole } from '@/types';

export default function SettingsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [areas, setAreas] = useState<FacilityArea[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [tab, setTab] = useState<'users' | 'areas'>('users');

    useEffect(() => {
        const supabase = createClient();
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: p } = await supabase.from('users').select('role').eq('id', user.id).single();
                const role = (p?.role || user.user_metadata?.role || 'staff') as UserRole;
                setIsAdmin(role === 'admin');
            }
            const { data: u } = await supabase.from('users').select('*').order('full_name');
            const { data: a } = await supabase.from('facility_areas').select('*').order('name');
            if (u) setUsers(u as User[]);
            if (a) setAreas(a as FacilityArea[]);
            setLoading(false);
        }
        fetchData();
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading settings…</p>
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <div className="page-header-info">
                    <h1>Settings</h1>
                    <p>Manage users, roles, and system configuration</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {tab === 'users' && (
                        <Link href="/dashboard/settings/users/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                            <Plus style={{ width: 16, height: 16 }} /> Add User
                        </Link>
                    )}
                    {tab === 'areas' && (
                        <Link href="/dashboard/settings/areas/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                            <Plus style={{ width: 16, height: 16 }} /> Add Area
                        </Link>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '1px solid var(--border-light)' }}>
                {(['users', 'areas'] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)} style={{
                        padding: '10px 20px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                        border: 'none', background: 'transparent',
                        color: tab === t ? 'var(--accent-muted)' : 'var(--text-muted)',
                        borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                        textTransform: 'capitalize', transition: 'all var(--duration) var(--ease)',
                    }}>{t === 'users' ? `Users (${users.length})` : `Areas (${areas.length})`}</button>
                ))}
            </div>

            {tab === 'users' && (
                <>
                    {isAdmin && <AddUserForm />}
                    <div className="card" style={{ overflow: 'hidden', marginTop: '16px' }}>
                        {users.length > 0 ? (
                            <table className="data-table">
                                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.id}>
                                            <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{u.full_name}</td>
                                            <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.email}</td>
                                            <td><StatusBadge label={ROLE_LABELS[u.role] || u.role} variant="neutral" /></td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    fontSize: '12px', fontWeight: 500,
                                                    color: u.is_active ? 'var(--success)' : 'var(--text-muted)',
                                                }}>
                                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: u.is_active ? 'var(--success)' : '#D4D4D0' }} />
                                                    {u.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <EmptyState title="No users found" />
                        )}
                    </div>
                </>
            )}

            {tab === 'areas' && (
                <div className="card" style={{ overflow: 'hidden' }}>
                    {areas.length > 0 ? (
                        <table className="data-table">
                            <thead><tr><th>Name</th><th>Type</th><th>Capacity</th><th>Bookable</th></tr></thead>
                            <tbody>
                                {areas.map((a) => (
                                    <tr key={a.id}>
                                        <td style={{ fontWeight: 500 }}>{a.name}</td>
                                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{a.type}</td>
                                        <td>{a.capacity}</td>
                                        <td><StatusBadge label={a.is_bookable ? 'Yes' : 'No'} variant={a.is_bookable ? 'success' : 'neutral'} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <EmptyState title="No facility areas defined" />
                    )}
                </div>
            )}
        </div>
    );
}
