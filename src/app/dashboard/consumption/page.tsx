'use client';

import { useEffect, useState } from 'react';
import { Droplets, Search, Plus, ClipboardList, AlertTriangle, Package, ArrowDownCircle, ArrowUpCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import RoleGate from '@/components/auth/RoleGate';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { formatRelativeTime } from '@/lib/utils';
import { CONSUMABLE_CATEGORY_LABELS } from '@/lib/constants';
import type { ConsumableItem, ConsumptionLog } from '@/types';

export default function ConsumptionPage() {
    const [items, setItems] = useState<ConsumableItem[]>([]);
    const [logs, setLogs] = useState<ConsumptionLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'low'>('all');

    useEffect(() => {
        const supabase = createClient();
        async function fetchData() {
            const { data: itemsData } = await supabase
                .from('consumable_items')
                .select('*')
                .eq('is_active', true)
                .order('name');

            const { data: logsData } = await supabase
                .from('consumption_logs')
                .select('*, item:consumable_items(name, unit), user:users!logged_by(full_name), area:facility_areas!area_id(name)')
                .order('logged_at', { ascending: false })
                .limit(20);

            if (itemsData) setItems(itemsData as ConsumableItem[]);
            if (logsData) setLogs(logsData as ConsumptionLog[]);
            setLoading(false);
        }
        fetchData();
    }, []);

    const lowStock = items.filter(i => i.current_stock <= i.reorder_threshold);
    const filtered = items.filter(i => {
        const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' || i.current_stock <= i.reorder_threshold;
        return matchSearch && matchFilter;
    });

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading consumption data…</p>
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <div className="page-header-info">
                    <h1>Consumption</h1>
                    <p>Track facility supply usage and stock levels</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Link href="/dashboard/consumption/log" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                        <ClipboardList style={{ width: 16, height: 16 }} /> Log Usage
                    </Link>
                    <RoleGate allowedRoles={['admin', 'facility_manager', 'cleaning_supervisor']}>
                        <Link href="/dashboard/consumption/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                            <Plus style={{ width: 16, height: 16 }} /> Add Item
                        </Link>
                    </RoleGate>
                </div>
            </div>

            {/* Stats */}
            <div className="grid-3" style={{ marginBottom: '20px', gap: '12px' }}>
                <div className="card card-pad" style={{ textAlign: 'center', padding: '16px' }}>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{items.length}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Total Items</div>
                </div>
                <div className="card card-pad" style={{ textAlign: 'center', padding: '16px' }}>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: lowStock.length > 0 ? 'var(--danger)' : 'var(--success)' }}>{lowStock.length}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Low Stock</div>
                </div>
                <div className="card card-pad" style={{ textAlign: 'center', padding: '16px' }}>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent-muted)' }}>{logs.length}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Recent Logs</div>
                </div>
            </div>

            {/* Low Stock Alert */}
            {lowStock.length > 0 && (
                <div style={{
                    padding: '14px 18px', marginBottom: '20px', borderRadius: 'var(--radius-md)',
                    background: 'var(--warning-light)', border: '1px solid #FDE68A',
                    display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                    <AlertTriangle style={{ width: 18, height: 18, color: '#D97706', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#92400E' }}>Low Stock Alert — </span>
                        <span style={{ fontSize: '13px', color: '#92400E' }}>
                            {lowStock.slice(0, 3).map(i => i.name).join(', ')}
                            {lowStock.length > 3 && ` and ${lowStock.length - 3} more`}
                        </span>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
                <div style={{ position: 'relative', maxWidth: '280px', flex: 1 }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-muted)' }} />
                    <input type="text" placeholder="Search items…" value={search} onChange={(e) => setSearch(e.target.value)} className="input" style={{ paddingLeft: '36px', fontSize: '13px' }} />
                </div>
                <button onClick={() => setFilter(f => f === 'all' ? 'low' : 'all')} className={`btn btn-sm ${filter === 'low' ? 'btn-primary' : 'btn-secondary'}`}>
                    <AlertTriangle style={{ width: 13, height: 13 }} /> {filter === 'low' ? 'Low Stock' : 'All Items'}
                </button>
            </div>

            {/* Items Table */}
            {filtered.length > 0 ? (
                <div className="card" style={{ overflow: 'hidden' }}>
                    <div className="table-responsive"><table className="data-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Category</th>
                                <th>Stock</th>
                                <th>Threshold</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(item => {
                                const isLow = item.current_stock <= item.reorder_threshold;
                                const isEmpty = item.current_stock === 0;
                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{
                                                    width: 34, height: 34, borderRadius: 'var(--radius-sm)',
                                                    background: isLow ? 'var(--danger-light)' : 'var(--accent-light)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <Droplets style={{ width: 16, height: 16, color: isLow ? 'var(--danger)' : 'var(--accent-muted)' }} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{item.name}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.unit}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-neutral">{CONSUMABLE_CATEGORY_LABELS[item.category] || item.category}</span>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 600, fontSize: '14px', color: isEmpty ? 'var(--danger)' : isLow ? '#D97706' : 'var(--text-primary)' }}>
                                                {item.current_stock}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)' }}>{item.reorder_threshold}</td>
                                        <td>
                                            <StatusBadge
                                                label={isEmpty ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                                                variant={isEmpty ? 'danger' : isLow ? 'warning' : 'success'}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table></div>
                </div>
            ) : (
                <div className="card"><EmptyState title="No consumable items" description="Add your first item to start tracking consumption." /></div>
            )}

            {/* Recent Activity */}
            {logs.length > 0 && (
                <div style={{ marginTop: '28px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>Recent Activity</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {logs.map(log => (
                            <div key={log.id} className="card card-pad-sm" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 'var(--radius-full)',
                                    background: log.action === 'consumed' ? 'var(--danger-light)' : 'var(--success-light)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    {log.action === 'consumed'
                                        ? <ArrowDownCircle style={{ width: 16, height: 16, color: 'var(--danger)' }} />
                                        : <ArrowUpCircle style={{ width: 16, height: 16, color: 'var(--success)' }} />
                                    }
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {log.action === 'consumed' ? 'Used' : 'Restocked'}{' '}
                                        <b>{log.quantity}</b> {(log.item as any)?.name || 'item'}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '10px', marginTop: '2px' }}>
                                        <span>by {(log.user as any)?.full_name || 'Unknown'}</span>
                                        {(log.area as any)?.name && <span>• {(log.area as any)?.name}</span>}
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <Clock style={{ width: 10, height: 10 }} /> {formatRelativeTime(log.logged_at)}
                                        </span>
                                    </div>
                                </div>
                                <StatusBadge label={log.action === 'consumed' ? 'Consumed' : 'Restocked'} variant={log.action === 'consumed' ? 'danger' : 'success'} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
