import { createClient } from '@/lib/supabase/server';
import type {
    User, FacilityArea, WorkOrder, Asset, Vendor, Contract,
    SpaceBooking, SupplyRequest, Expense, Notification, UserRole,
} from '@/types';

// ---- Current User ----

export async function getCurrentUser(): Promise<User | null> {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;

    // Try fetching the profile from the users table
    const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

    if (data) return data as User;

    // Fallback: build a user from auth metadata (users table may not exist yet)
    return {
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        role: (authUser.user_metadata?.role as UserRole) || 'admin',
        is_active: true,
        created_at: authUser.created_at,
        updated_at: authUser.created_at,
    } as User;
}

// ---- Users ----

export async function getUsers(): Promise<User[]> {
    const supabase = await createClient();
    const { data } = await supabase.from('users').select('*').order('full_name');
    return (data || []) as User[];
}

export async function createUser(email: string, password: string, full_name: string, role: UserRole) {
    const supabase = await createClient();
    // Use admin-level signUp — the trigger will create the profile row
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role },
    });
    if (error) throw error;
    return data;
}

// ---- Facility Areas ----

export async function getAreas(): Promise<FacilityArea[]> {
    const supabase = await createClient();
    const { data } = await supabase.from('facility_areas').select('*').order('name');
    return (data || []) as FacilityArea[];
}

export async function createArea(area: { name: string; type: string; capacity: number; key_features: string; is_bookable: boolean }) {
    const supabase = await createClient();
    const { data, error } = await supabase.from('facility_areas').insert(area).select().single();
    if (error) throw error;
    return data;
}

// ---- Work Orders ----

export async function getWorkOrders(): Promise<WorkOrder[]> {
    const supabase = await createClient();
    const { data } = await supabase
        .from('work_orders')
        .select('*, submitter:users!submitted_by(*), area:facility_areas!location_area(*)')
        .order('created_at', { ascending: false });
    return (data || []) as WorkOrder[];
}

// ---- Assets ----

export async function getAssets(): Promise<Asset[]> {
    const supabase = await createClient();
    const { data } = await supabase
        .from('assets')
        .select('*, area:facility_areas!location_area(*)')
        .order('name');
    return (data || []) as Asset[];
}

export async function createAsset(asset: {
    name: string; category: string; location_area: string;
    serial_number: string; purchase_date: string; condition: string;
    quantity: number; image_url?: string; responsible_party: string;
}) {
    const supabase = await createClient();
    const { data, error } = await supabase.from('assets').insert(asset).select().single();
    if (error) throw error;
    return data;
}

export async function deleteAsset(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) throw error;
}

// ---- Vendors ----

export async function getVendors(): Promise<Vendor[]> {
    const supabase = await createClient();
    const { data: vendors } = await supabase.from('vendors').select('*').order('company_name');
    const { data: contacts } = await supabase.from('vendor_contacts').select('*');

    return (vendors || []).map((v) => ({
        ...v,
        contacts: (contacts || []).filter((c) => c.vendor_id === v.id),
    })) as Vendor[];
}

// ---- Contracts ----

export async function getContracts(): Promise<Contract[]> {
    const supabase = await createClient();
    const { data } = await supabase
        .from('contracts')
        .select('*, vendor:vendors!vendor_id(*)')
        .order('start_date', { ascending: false });
    return (data || []) as Contract[];
}

// ---- Bookings ----

export async function getBookings(): Promise<SpaceBooking[]> {
    const supabase = await createClient();
    const { data } = await supabase
        .from('space_bookings')
        .select('*, area:facility_areas!facility_area_id(*), requester:users!requested_by(*)')
        .order('booking_date', { ascending: false });
    return (data || []) as SpaceBooking[];
}

// ---- Supply Requests ----

export async function getSupplyRequests(): Promise<SupplyRequest[]> {
    const supabase = await createClient();
    const { data: requests } = await supabase
        .from('supply_requests')
        .select('*, submitter:users!submitted_by(*), area:facility_areas!area_of_use(*)')
        .order('created_at', { ascending: false });

    const { data: items } = await supabase.from('supply_request_items').select('*');

    return (requests || []).map((sr) => ({
        ...sr,
        items: (items || []).filter((i) => i.supply_request_id === sr.id),
    })) as SupplyRequest[];
}

// ---- Expenses ----

export async function getExpenses(): Promise<Expense[]> {
    const supabase = await createClient();
    const { data } = await supabase
        .from('expenses')
        .select('*, submitter:users!submitted_by(*)')
        .order('expense_date', { ascending: false });
    return (data || []) as Expense[];
}

// ---- Notifications ----

export async function getNotifications(userId: string): Promise<Notification[]> {
    const supabase = await createClient();
    const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
    return (data || []) as Notification[];
}

// ---- Dashboard Stats (computed) ----

export async function getDashboardStats() {
    const supabase = await createClient();

    const { count: openWO } = await supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['submitted', 'pending_approval', 'approved', 'in_progress']);

    const { count: pendingApprovals } = await supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_approval');

    const { count: upcomingBookings } = await supabase
        .from('space_bookings')
        .select('*', { count: 'exact', head: true })
        .gte('booking_date', new Date().toISOString().split('T')[0])
        .in('status', ['pending', 'approved']);

    const { data: expenses } = await supabase
        .from('expenses')
        .select('amount, category');

    const monthlySpend = (expenses || []).reduce((sum, e) => sum + Number(e.amount), 0);

    const expenseByCategory: { category: string; amount: number }[] = [];
    for (const e of expenses || []) {
        const existing = expenseByCategory.find((c) => c.category === e.category);
        if (existing) existing.amount += Number(e.amount);
        else expenseByCategory.push({ category: e.category, amount: Number(e.amount) });
    }

    return {
        open_work_orders: openWO || 0,
        pending_approvals: pendingApprovals || 0,
        upcoming_bookings: upcomingBookings || 0,
        monthly_spend: monthlySpend,
        expense_by_category: expenseByCategory,
    };
}
