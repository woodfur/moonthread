import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();

    // Verify caller is admin
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: caller } = await supabase.from('users').select('role').eq('id', authUser.id).single();
    if (caller?.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { email, password, full_name, role } = await request.json();

    // Create user via Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role },
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ user: data.user });
}
