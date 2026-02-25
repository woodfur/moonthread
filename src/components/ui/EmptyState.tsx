import { Inbox } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '56px 24px', textAlign: 'center',
        }}>
            <div style={{
                width: 56, height: 56, borderRadius: 'var(--radius-lg)',
                background: 'var(--surface-raised)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
            }}>
                <Inbox style={{ width: 24, height: 24, color: 'var(--text-muted)' }} />
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {title}
            </div>
            {description && (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '320px' }}>
                    {description}
                </div>
            )}
            {action && <div style={{ marginTop: '16px' }}>{action}</div>}
        </div>
    );
}
