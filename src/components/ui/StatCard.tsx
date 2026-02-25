import { TrendingUp } from 'lucide-react';

interface StatCardProps {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    value: string | number;
    change?: number;
}

export default function StatCard({ icon, iconBg, label, value, change }: StatCardProps) {
    const isPositive = change && change > 0;

    return (
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-md)',
                    background: iconBg, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    {icon}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    {label}
                </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                {change !== undefined && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        fontSize: '12px', fontWeight: 500,
                        color: isPositive ? 'var(--success)' : 'var(--danger)',
                    }}>
                        <TrendingUp style={{
                            width: 14, height: 14,
                            transform: isPositive ? 'none' : 'rotate(180deg)',
                        }} />
                        {isPositive ? '+' : ''}{change}%
                    </div>
                )}
            </div>

            <div className="text-stat">{value}</div>
        </div>
    );
}
