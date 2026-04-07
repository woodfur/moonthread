'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, UserRole } from '@/types';

interface AuthContextType {
    user: User | null;
    role: UserRole;
    loading: boolean;
    /** Auth user ID from Supabase auth (available before profile loads) */
    authId: string | null;
    /** Re-fetch user profile from the database (e.g. after a role change) */
    refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: 'staff',
    loading: true,
    authId: null,
    refreshAuth: async () => {},
});

export function useAuth() {
    return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>('staff');
    const [authId, setAuthId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const loadUser = useCallback(async () => {
        const supabase = createClient();

        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
                setUser(null);
                setRole('staff');
                setAuthId(null);
                setLoading(false);
                return;
            }

            setAuthId(authUser.id);

            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (profile) {
                setUser(profile as User);
                setRole((profile.role || 'staff') as UserRole);
            } else {
                // Fallback: use metadata from auth user
                setRole((authUser.user_metadata?.role || 'staff') as UserRole);
            }
        } catch {
            // Supabase unreachable — default to staff (most restricted)
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUser();

        // Listen for auth state changes (sign-out, token refresh, etc.)
        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                setUser(null);
                setRole('staff');
                setAuthId(null);
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                loadUser();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [loadUser]);

    const refreshAuth = useCallback(async () => {
        await loadUser();
    }, [loadUser]);

    return (
        <AuthContext.Provider value={{ user, role, loading, authId, refreshAuth }}>
            {children}
        </AuthContext.Provider>
    );
}
