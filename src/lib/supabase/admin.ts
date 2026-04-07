import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client with **service role** privileges.
 *
 * ⚠️  This client bypasses Row Level Security — use it ONLY in
 *     server-side code (API routes, server actions) for admin
 *     operations like creating users or updating roles.
 *
 * NEVER import this in client components or expose it to the browser.
 */
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error(
            'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
            'Add SUPABASE_SERVICE_ROLE_KEY to .env.local (find it in Supabase Dashboard → Settings → API).'
        );
    }

    return createClient(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
