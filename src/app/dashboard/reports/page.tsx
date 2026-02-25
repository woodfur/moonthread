'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, PieChart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { WORK_ORDER_CATEGORY_LABELS } from '@/lib/constants';

interface ChartItem { label: string; value: number; color: string }

const COLORS = ['#F6CE71', '#D4A843', '#22C55E', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#14B8A6'];

export default function ReportsPage() {
    const [woByCategory, setWoByCategory] = useState<ChartItem[]>([]);
    const [expenseByCategory, setExpenseByCategory] = useState<ChartItem[]>([]);
    const [bookingsBySpace, setBookingsBySpace] = useState<ChartItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();
        async function fetchData() {
            // Work orders by category
            const { data: wos } = await supabase.from('work_orders').select('category');
            const woCounts: Record<string, number> = {};
            for (const wo of wos || []) { woCounts[wo.category] = (woCounts[wo.category] || 0) + 1; }
            setWoByCategory(Object.entries(woCounts).map(([k, v], i) => ({
                label: WORK_ORDER_CATEGORY_LABELS[k as keyof typeof WORK_ORDER_CATEGORY_LABELS] || k,
                value: v, color: COLORS[i % COLORS.length],
            })));

            // Expenses by category
            const { data: exps } = await supabase.from('expenses').select('category, amount');
            const expTotals: Record<string, number> = {};
            for (const e of exps || []) { expTotals[e.category] = (expTotals[e.category] || 0) + Number(e.amount); }
            setExpenseByCategory(Object.entries(expTotals).map(([k, v], i) => ({
                label: k.replace('_', ' '), value: v, color: COLORS[i % COLORS.length],
            })));

            // Bookings by space
            const { data: bookings } = await supabase.from('space_bookings').select('area:facility_areas!facility_area_id(name)');
            const spaceCounts: Record<string, number> = {};
            for (const b of bookings || []) { const areaData = b.area as unknown as { name: string } | null; const name = areaData?.name || 'Unknown'; spaceCounts[name] = (spaceCounts[name] || 0) + 1; }
            setBookingsBySpace(Object.entries(spaceCounts).map(([k, v], i) => ({
                label: k, value: v, color: COLORS[i % COLORS.length],
            })));

            setLoading(false);
        }
        fetchData();
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading reports…</p>
        </div>
    );

    const maxWO = Math.max(...woByCategory.map(w => w.value), 1);
    const maxExp = Math.max(...expenseByCategory.map(e => e.value), 1);
    const maxBook = Math.max(...bookingsBySpace.map(b => b.value), 1);

    const renderChart = (title: string, icon: React.ReactNode, items: ChartItem[], max: number, formatter?: (v: number) => string) => (
        <div className="card card-pad" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                {icon}
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
            </div>
            {items.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {items.map((item) => (
                        <div key={item.label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatter ? formatter(item.value) : item.value}</span>
                            </div>
                            <div style={{ height: 8, borderRadius: 4, background: 'var(--surface-raised)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 4, background: item.color, width: `${(item.value / max) * 100}%`, transition: 'width 0.6s ease' }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No data available</p>
            )}
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <div className="page-header-info">
                    <h1>Reports & Analytics</h1>
                    <p>Insights into facility operations and spending</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                {renderChart('Work Orders by Category', <BarChart3 style={{ width: 16, height: 16, color: 'var(--accent-muted)' }} />, woByCategory, maxWO)}
                {renderChart('Expenses by Category', <TrendingUp style={{ width: 16, height: 16, color: '#22C55E' }} />, expenseByCategory, maxExp, formatCurrency)}
            </div>

            {renderChart('Bookings by Space', <PieChart style={{ width: 16, height: 16, color: '#8B5CF6' }} />, bookingsBySpace, maxBook)}
        </div>
    );
}
