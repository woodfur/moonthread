'use client';

import { Bell, Search, Plus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { formatRelativeTime } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Notification } from '@/types';

export default function Header() {
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const notifRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (user) {
                const { data } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(10);
                if (data) setNotifications(data as Notification[]);
            }
        });
    }, []);

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header style={{
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            padding: '0 32px',
            background: 'transparent',
        }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
                <Search style={{
                    position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                    width: 16, height: 16, color: 'var(--text-muted)',
                }} />
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input input-with-icon"
                    style={{ width: '220px', padding: '8px 14px 8px 38px', fontSize: '13px' }}
                />
            </div>

            {/* Notifications */}
            <div ref={notifRef} style={{ position: 'relative' }}>
                <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    style={{
                        width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-secondary)', position: 'relative',
                        transition: 'all var(--duration) var(--ease)',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface-raised)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                    <Bell style={{ width: 18, height: 18 }} />
                    {unreadCount > 0 && (
                        <span style={{
                            position: 'absolute', top: '6px', right: '6px',
                            width: 8, height: 8, borderRadius: '50%',
                            background: 'var(--danger)', border: '2px solid var(--bg)',
                        }} />
                    )}
                </button>

                {/* Dropdown */}
                {showNotifications && (
                    <div style={{
                        position: 'absolute', top: '44px', right: 0,
                        width: '340px',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 50,
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--border-light)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                Notifications
                            </span>
                            {unreadCount > 0 && (
                                <span className="badge badge-accent">{unreadCount} new</span>
                            )}
                        </div>
                        <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                            {notifications.length > 0 ? notifications.slice(0, 5).map((n) => (
                                <div
                                    key={n.id}
                                    style={{
                                        padding: '14px 20px',
                                        borderBottom: '1px solid var(--border-light)',
                                        cursor: 'pointer',
                                        transition: 'background var(--duration) var(--ease)',
                                        background: !n.is_read ? 'var(--accent-light)' : 'transparent',
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.background = !n.is_read ? 'var(--accent-light)' : 'transparent'; }}
                                >
                                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '2px' }}>
                                        {n.title}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        {formatRelativeTime(n.created_at)}
                                    </div>
                                </div>
                            )) : (
                                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                                    No notifications
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

        </header>
    );
}
