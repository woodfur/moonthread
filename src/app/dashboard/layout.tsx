'use client';

import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
            <Sidebar />
            <div style={{
                flex: 1,
                marginLeft: 'var(--sidebar-width)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
                <Header />
                <main style={{ flex: 1, padding: '0 32px 32px 32px' }} className="animate-in">
                    {children}
                </main>
            </div>
        </div>
    );
}
