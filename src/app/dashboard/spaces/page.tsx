'use client';

import { useEffect, useState } from 'react';
import { MapPin, Users, Calendar, Plus } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import AddSpaceForm from './AddSpaceForm';
import { formatDate } from '@/lib/utils';
import type { FacilityArea, SpaceBooking, UserRole } from '@/types';

export default function SpacesPage() {
    const [areas, setAreas] = useState<FacilityArea[]>([]);
    const [bookings, setBookings] = useState<SpaceBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<UserRole>('staff');

    useEffect(() => {
        const supabase = createClient();
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: p } = await supabase.from('users').select('role').eq('id', user.id).single();
                setUserRole((p?.role || user.user_metadata?.role || 'staff') as UserRole);
            }
            const { data: a } = await supabase.from('facility_areas').select('*').order('name');
            const { data: b } = await supabase.from('space_bookings').select('*, area:facility_areas!facility_area_id(name), requester:users!requested_by(full_name)').order('booking_date', { ascending: false });
            if (a) setAreas(a as FacilityArea[]);
            if (b) setBookings(b as SpaceBooking[]);
            setLoading(false);
        }
        fetchData();
    }, []);

    const isAdmin = userRole === 'admin';
    const BOOKING_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'accent'> = {
        pending: 'warning', approved: 'success', denied: 'danger', cancelled: 'neutral',
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading spaces…</p>
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <div className="page-header-info">
                    <h1>Spaces & Bookings</h1>
                    <p>Manage facility areas and booking requests</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Link href="/dashboard/spaces/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                        <Plus style={{ width: 16, height: 16 }} /> Add Area
                    </Link>
                    <Link href="/dashboard/spaces/bookings/new" className="btn btn-outline" style={{ textDecoration: 'none' }}>
                        <Plus style={{ width: 16, height: 16 }} /> Add Booking
                    </Link>
                </div>
            </div>

            {/* Facility Areas */}
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>Facility Areas</h2>
            {areas.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    {areas.map((area) => (
                        <div key={area.id} className="card" style={{ overflow: 'hidden' }}>
                            <div style={{
                                padding: '18px 20px', background: 'linear-gradient(135deg, #D4A843 0%, #F6CE71 100%)',
                                color: '#1A1A1A',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '15px', fontWeight: 600 }}>{area.name}</div>
                                    <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'capitalize', background: 'rgba(26,26,26,0.12)', padding: '3px 10px', borderRadius: '20px' }}>{area.type}</div>
                                </div>
                            </div>
                            <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    <Users style={{ width: 13, height: 13 }} /> Capacity: {area.capacity}
                                </div>
                                {area.key_features && (
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{area.key_features}</div>
                                )}
                                <StatusBadge label={area.is_bookable ? 'Bookable' : 'Not Bookable'} variant={area.is_bookable ? 'success' : 'neutral'} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card" style={{ marginBottom: '24px' }}>
                    <EmptyState title="No facility areas defined" description={isAdmin ? 'Admin can add spaces below.' : 'No spaces have been configured yet.'} />
                </div>
            )}

            {isAdmin && <AddSpaceForm />}

            {/* Bookings */}
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px', marginTop: '24px' }}>Bookings</h2>
            <div className="card" style={{ overflow: 'hidden' }}>
                {bookings.length > 0 ? (
                    <table className="data-table">
                        <thead><tr><th>Event</th><th>Space</th><th>Date</th><th>Time</th><th>Requested By</th><th>Status</th></tr></thead>
                        <tbody>
                            {bookings.map((b) => (
                                <tr key={b.id}>
                                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{b.purpose}</td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{b.area?.name}</td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(b.booking_date)}</td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{b.start_time}–{b.end_time}</td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{b.requester?.full_name}</td>
                                    <td><StatusBadge label={b.status} variant={BOOKING_VARIANT[b.status] || 'neutral'} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <EmptyState title="No bookings yet" />
                )}
            </div>
        </div>
    );
}
