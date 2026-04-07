import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    // 1. Verify the caller is an admin using the regular (RLS-respecting) client
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: caller } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single();

    if (caller?.role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 2. Parse the request body
    const { email, password, full_name, role } = await request.json();

    if (!email || !password || !full_name || !role) {
        return NextResponse.json(
            { error: 'Missing required fields: email, password, full_name, role' },
            { status: 400 }
        );
    }

    // 3. Create the user using the admin client (service role key — bypasses RLS)
    const adminClient = createAdminClient();

    const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role },
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ user: data.user });
}
