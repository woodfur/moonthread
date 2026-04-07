'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import AuthProvider from '@/components/auth/AuthProvider';
import RouteGuard from '@/components/auth/RouteGuard';

// Mobile menu context so Header hamburger can toggle Sidebar
const MobileMenuContext = createContext<{
    isOpen: boolean;
    toggle: () => void;
    close: () => void;
}>({ isOpen: false, toggle: () => {}, close: () => {} });

export function useMobileMenu() {
    return useContext(MobileMenuContext);
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const toggle = useCallback(() => setMobileMenuOpen((v) => !v), []);
    const close = useCallback(() => setMobileMenuOpen(false), []);

    return (
        <AuthProvider>
            <RouteGuard>
                <MobileMenuContext.Provider value={{ isOpen: mobileMenuOpen, toggle, close }}>
                    <div className="dashboard-shell">
                        <Sidebar />
                        <div className="dashboard-content">
                            <Header />
                            <main className="dashboard-main animate-in">
                                {children}
                            </main>
                        </div>
                        {/* Mobile overlay backdrop */}
                        {mobileMenuOpen && (
                            <div
                                className="mobile-overlay"
                                onClick={close}
                            />
                        )}
                    </div>
                </MobileMenuContext.Provider>
            </RouteGuard>
        </AuthProvider>
    );
}
