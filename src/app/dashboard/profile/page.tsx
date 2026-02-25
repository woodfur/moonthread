'use client';

import { useEffect, useState } from 'react';
import { User, Mail, Shield, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ROLE_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import type { UserRole } from '@/types';

export default function ProfilePage() {
    const [profile, setProfile] = useState<{ full_name: string; email: string; role: UserRole; created_at: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (user) {
                const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
                setProfile({
                    full_name: data?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                    email: user.email || '',
                    role: (data?.role || user.user_metadata?.role || 'staff') as UserRole,
                    created_at: user.created_at,
                });
            }
            setLoading(false);
        });
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading profile…</p>
        </div>
    );

    if (!profile) return <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '60px' }}>Not logged in</p>;

    const initials = profile.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    return (
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            <div className="page-header">
                <div className="page-header-info">
                    <h1>My Profile</h1>
                    <p>Your account information</p>
                </div>
            </div>

            <div className="card card-pad" style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #D4A843, #F6CE71)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 14px', fontSize: '24px', fontWeight: 700, color: '#1A1A1A',
                }}>{initials}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{profile.full_name}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{ROLE_LABELS[profile.role] || profile.role}</div>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
                {[
                    { icon: Mail, label: 'Email', value: profile.email },
                    { icon: Shield, label: 'Role', value: ROLE_LABELS[profile.role] || profile.role },
                    { icon: Calendar, label: 'Joined', value: formatDate(profile.created_at) },
                ].map((item, idx) => (
                    <div key={item.label} style={{
                        display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 24px',
                        borderBottom: idx < 2 ? '1px solid var(--border-light)' : undefined,
                    }}>
                        <item.icon style={{ width: 16, height: 16, color: 'var(--text-muted)', flexShrink: 0 }} />
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '60px' }}>{item.label}</div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
