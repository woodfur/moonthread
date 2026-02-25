import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
    return format(new Date(date), 'MMM dd, yyyy');
}

export function formatDateTime(date: string | Date) {
    return format(new Date(date), 'MMM dd, yyyy h:mm a');
}

export function formatTime(time: string) {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
}

export function formatRelativeTime(date: string | Date) {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

export function generateWorkOrderNumber() {
    const year = new Date().getFullYear();
    const rand = Math.floor(Math.random() * 9999)
        .toString()
        .padStart(4, '0');
    return `WO-${year}-${rand}`;
}

export function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
