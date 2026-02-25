import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    // Skip auth if credentials not properly configured
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project')) {
        return supabaseResponse;
    }

    try {
        const supabase = createServerClient(supabaseUrl, supabaseKey, {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        });

        const {
            data: { user },
        } = await supabase.auth.getUser();

        // Redirect unauthenticated users away from protected routes
        if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }

        // Redirect unauthenticated users away from API routes
        if (!user && request.nextUrl.pathname.startsWith('/api/admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Redirect authenticated users away from login to dashboard
        if (user && request.nextUrl.pathname === '/login') {
            const url = request.nextUrl.clone();
            url.pathname = '/dashboard';
            return NextResponse.redirect(url);
        }

        // Redirect root to dashboard or login
        if (request.nextUrl.pathname === '/') {
            const url = request.nextUrl.clone();
            url.pathname = user ? '/dashboard' : '/login';
            return NextResponse.redirect(url);
        }
    } catch {
        // Supabase unreachable — let unauthenticated routes through, block dashboard
        if (request.nextUrl.pathname.startsWith('/dashboard')) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}
