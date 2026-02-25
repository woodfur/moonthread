interface StatusBadgeProps {
    label: string;
    variant?: 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
}

const VARIANT_MAP: Record<string, string> = {
    accent: 'badge-accent',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    neutral: 'badge-neutral',
};

export default function StatusBadge({ label, variant = 'neutral' }: StatusBadgeProps) {
    return (
        <span className={`badge ${VARIANT_MAP[variant] || 'badge-neutral'}`}>
            {label}
        </span>
    );
}
