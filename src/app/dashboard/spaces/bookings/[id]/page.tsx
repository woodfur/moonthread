'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Clock, Users, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils';
import type { SpaceBooking, BookingStatus, UserRole } from '@/types';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
    pending: 'warning', approved: 'success', rejected: 'danger', cancelled: 'neutral',
};

const NEXT_STATUSES: Record<string, { label: string; status: BookingStatus; variant: string }[]> = {
    pending: [
        { label: 'Approve', status: 'approved', variant: 'success' },
        { label: 'Reject', status: 'rejected', variant: 'danger' },
    ],
    approved: [
        { label: 'Cancel', status: 'cancelled', variant: 'neutral' },
    ],
};

export default function BookingDetailPage() {
    const { id } = useParams();
    const [booking, setBooking] = useState<SpaceBooking | null>(null);
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
            const { data } = await supabase.from('space_bookings')
                .select('*, area:facility_areas!facility_area_id(name, capacity), requester:users!requested_by(full_name, email)')
                .eq('id', id).single();
            if (data) setBooking(data as SpaceBooking);
            setLoading(false);
        }
        load();
    }, [id]);

    const handleStatusChange = async (newStatus: BookingStatus) => {
        if (!booking) return;
        setUpdating(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const updateData: Record<string, unknown> = { status: newStatus };
        if (newStatus === 'approved') updateData.approved_by = user?.id;
        const { error } = await supabase.from('space_bookings').update(updateData).eq('id', booking.id);
        if (!error) setBooking({ ...booking, status: newStatus });
        setUpdating(false);
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading booking…</p>
        </div>
    );

    if (!booking) return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: 'var(--text-muted)' }}>Booking not found</p>
            <Link href="/dashboard/spaces" className="btn btn-secondary" style={{ marginTop: '16px', textDecoration: 'none' }}>Back to Spaces</Link>
        </div>
    );

    const canManage = userRole === 'admin' || userRole === 'facility_manager';
    const actions = canManage ? (NEXT_STATUSES[booking.status] || []) : [];

    return (
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Link href="/dashboard/spaces" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', padding: '8px' }}>
                    <ArrowLeft style={{ width: 18, height: 18 }} />
                </Link>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>Booking Details</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <StatusBadge label={booking.status} variant={STATUS_VARIANT[booking.status] || 'neutral'} />
                    </div>
                </div>
            </div>

            {/* Status Actions */}
            {actions.length > 0 && (
                <div className="card card-pad" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-raised)' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginRight: 'auto' }}>Actions:</span>
                    {actions.map((a) => (
                        <button key={a.status} onClick={() => handleStatusChange(a.status)} disabled={updating}
                            className="btn btn-sm"
                            style={{
                                background: a.variant === 'success' ? 'var(--success)' : a.variant === 'danger' ? 'var(--danger)' : 'var(--surface)',
                                color: a.variant !== 'neutral' ? '#fff' : 'var(--text-primary)', border: a.variant === 'neutral' ? '1px solid var(--border)' : 'none',
                            }}
                        >{a.label}</button>
                    ))}
                </div>
            )}

            {/* Details */}
            <div className="card" style={{ overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', background: 'linear-gradient(135deg, rgba(246,206,113,0.1), rgba(212,168,67,0.05))' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{booking.purpose}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{booking.area?.name}</div>
                </div>
                {[
                    { icon: MapPin, label: 'Space', value: booking.area?.name || '—' },
                    { icon: Calendar, label: 'Date', value: formatDate(booking.booking_date) },
                    { icon: Clock, label: 'Time', value: `${booking.start_time} – ${booking.end_time}` },
                    { icon: Users, label: 'Expected Attendees', value: String(booking.expected_attendees) },
                    { icon: FileText, label: 'Requested By', value: booking.requester?.full_name || '—' },
                ].map((item, idx, arr) => (
                    <div key={item.label} style={{
                        display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 24px',
                        borderBottom: idx < arr.length - 1 ? '1px solid var(--border-light)' : undefined,
                    }}>
                        <item.icon style={{ width: 15, height: 15, color: 'var(--text-muted)', flexShrink: 0 }} />
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '120px' }}>{item.label}</div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.value}</div>
                    </div>
                ))}
            </div>

            {/* Setup Requirements */}
            {booking.setup_requirements && (
                <div className="card card-pad">
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Setup Requirements</div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{booking.setup_requirements}</p>
                </div>
            )}

            {booking.cancellation_reason && (
                <div className="card card-pad" style={{ marginTop: '16px', background: '#FEF2F2', border: '1px solid #FECACA' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--danger)', marginBottom: '6px' }}>Cancellation Reason</div>
                    <p style={{ fontSize: '13px', color: '#991B1B' }}>{booking.cancellation_reason}</p>
                </div>
            )}
        </div>
    );
}
