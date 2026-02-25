-- ============================================
-- FMS — Full Database Schema Migration
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. Users profile table (extends auth.users)
-- ============================================
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  email text not null unique,
  role text not null default 'staff' check (role in ('admin', 'facility_manager', 'cleaning_supervisor', 'staff')),
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read all profiles" on public.users
  for select using (true);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Admins can manage all users" on public.users
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- ============================================
-- 2. Facility Areas
-- ============================================
create table public.facility_areas (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text not null,
  capacity integer not null default 0,
  key_features text,
  is_bookable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.facility_areas enable row level security;

create policy "Anyone can read facility areas" on public.facility_areas
  for select using (true);

create policy "FM and Admin can manage areas" on public.facility_areas
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'facility_manager'))
  );

-- ============================================
-- 3. Work Orders
-- ============================================
create table public.work_orders (
  id uuid default uuid_generate_v4() primary key,
  work_order_number text not null unique,
  submitted_by uuid references public.users(id) not null,
  location_area uuid references public.facility_areas(id),
  category text not null check (category in ('plumbing', 'electrical', 'hvac', 'structural', 'general', 'other')),
  description text not null,
  urgency text not null check (urgency in ('low', 'medium', 'high', 'emergency')),
  status text not null default 'submitted' check (status in ('submitted', 'pending_approval', 'approved', 'in_progress', 'on_hold', 'completed', 'rejected')),
  assigned_to_user uuid references public.users(id),
  assigned_to_vendor uuid,
  rejection_reason text,
  photo_attachments text[],
  approved_by uuid references public.users(id),
  approved_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.work_orders enable row level security;

create policy "Staff see own work orders" on public.work_orders
  for select using (
    submitted_by = auth.uid() or
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'facility_manager'))
  );

create policy "Staff can create work orders" on public.work_orders
  for insert with check (submitted_by = auth.uid());

create policy "FM and Admin can update work orders" on public.work_orders
  for update using (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'facility_manager'))
  );

-- ============================================
-- 4. Assets
-- ============================================
create table public.assets (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text not null check (category in ('hvac_utilities', 'av_electronics', 'kitchen_cafeteria', 'sports_recreation', 'furniture_fixtures', 'cleaning_janitorial')),
  location_area uuid references public.facility_areas(id),
  serial_number text,
  purchase_date date,
  condition text not null default 'good' check (condition in ('excellent', 'good', 'fair', 'poor', 'decommissioned')),
  responsible_party uuid references public.users(id),
  document_attachments text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.assets enable row level security;

create policy "FM and Admin can manage assets" on public.assets
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'facility_manager'))
  );

-- Asset Maintenance Schedules
create table public.asset_maintenance_schedules (
  id uuid default uuid_generate_v4() primary key,
  asset_id uuid references public.assets(id) on delete cascade not null,
  schedule_type text not null check (schedule_type in ('weekly', 'monthly', 'quarterly', 'annually')),
  next_due_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.asset_maintenance_schedules enable row level security;

create policy "FM and Admin can manage maintenance schedules" on public.asset_maintenance_schedules
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'facility_manager'))
  );

-- ============================================
-- 5. Vendors
-- ============================================
create table public.vendors (
  id uuid default uuid_generate_v4() primary key,
  company_name text not null,
  service_category text,
  rating integer check (rating >= 1 and rating <= 5),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vendors enable row level security;

create policy "FM and Admin can manage vendors" on public.vendors
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'facility_manager'))
  );

-- Vendor Contacts
create table public.vendor_contacts (
  id uuid default uuid_generate_v4() primary key,
  vendor_id uuid references public.vendors(id) on delete cascade not null,
  name text not null,
  phone text,
  email text,
  is_primary boolean not null default false
);

alter table public.vendor_contacts enable row level security;

create policy "FM and Admin can manage vendor contacts" on public.vendor_contacts
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'facility_manager'))
  );

-- Contracts
create table public.contracts (
  id uuid default uuid_generate_v4() primary key,
  vendor_id uuid references public.vendors(id) not null,
  service_description text not null,
  start_date date not null,
  end_date date not null,
  renewal_date date,
  value decimal(12,2) not null default 0,
  status text not null default 'active' check (status in ('active', 'expired', 'under_review', 'terminated')),
  document_attachment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contracts enable row level security;

create policy "FM and Admin can manage contracts" on public.contracts
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'facility_manager'))
  );

-- Vendor Payments
create table public.vendor_payments (
  id uuid default uuid_generate_v4() primary key,
  vendor_id uuid references public.vendors(id) not null,
  contract_id uuid references public.contracts(id),
  work_order_id uuid references public.work_orders(id),
  amount decimal(12,2) not null,
  invoice_reference text,
  payment_method text,
  payment_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vendor_payments enable row level security;

create policy "FM and Admin can manage payments" on public.vendor_payments
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'facility_manager'))
  );

-- ============================================
-- 6. Space Bookings
-- ============================================
create table public.space_bookings (
  id uuid default uuid_generate_v4() primary key,
  facility_area_id uuid references public.facility_areas(id) not null,
  requested_by uuid references public.users(id) not null,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  purpose text not null,
  expected_attendees integer not null default 0,
  setup_requirements text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by uuid references public.users(id),
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.space_bookings enable row level security;

create policy "Staff see own bookings" on public.space_bookings
  for select using (
    requested_by = auth.uid() or
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'facility_manager'))
  );

create policy "Staff can create bookings" on public.space_bookings
  for insert with check (requested_by = auth.uid());

create policy "FM and Admin can update bookings" on public.space_bookings
  for update using (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'facility_manager'))
  );

-- Double-booking prevention function
create or replace function check_booking_conflict()
returns trigger as $$
begin
  if exists (
    select 1 from public.space_bookings
    where facility_area_id = NEW.facility_area_id
      and booking_date = NEW.booking_date
      and status in ('pending', 'approved')
      and id != coalesce(NEW.id, uuid_generate_v4())
      and (NEW.start_time, NEW.end_time) overlaps (start_time, end_time)
  ) then
    raise exception 'Booking conflict: this space is already booked for the requested time slot.';
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger prevent_double_booking
  before insert or update on public.space_bookings
  for each row
  execute function check_booking_conflict();

-- ============================================
-- 7. Supply Requests
-- ============================================
create table public.supply_requests (
  id uuid default uuid_generate_v4() primary key,
  submitted_by uuid references public.users(id) not null,
  area_of_use uuid references public.facility_areas(id),
  priority text not null default 'routine' check (priority in ('routine', 'urgent')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'partially_approved', 'rejected', 'fulfilled')),
  approved_by uuid references public.users(id),
  approval_comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.supply_requests enable row level security;

create policy "Cleaning supervisor sees own requests" on public.supply_requests
  for select using (
    submitted_by = auth.uid() or
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'facility_manager'))
  );

create policy "Cleaning supervisor can create requests" on public.supply_requests
  for insert with check (submitted_by = auth.uid());

create policy "FM and Admin can update requests" on public.supply_requests
  for update using (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'facility_manager'))
  );

-- Supply Request Items
create table public.supply_request_items (
  id uuid default uuid_generate_v4() primary key,
  supply_request_id uuid references public.supply_requests(id) on delete cascade not null,
  item_name text not null,
  quantity integer not null default 1,
  unit text not null default 'pieces',
  notes text,
  is_approved boolean not null default true
);

alter table public.supply_request_items enable row level security;

create policy "Same access as supply requests" on public.supply_request_items
  for all using (
    exists (
      select 1 from public.supply_requests sr
      where sr.id = supply_request_id
        and (sr.submitted_by = auth.uid() or
             exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'facility_manager')))
    )
  );

-- ============================================
-- 8. Expenses
-- ============================================
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  submitted_by uuid references public.users(id) not null,
  description text not null,
  amount decimal(12,2) not null,
  category text not null check (category in ('maintenance_repairs', 'cleaning_supplies', 'vendor_payments', 'utilities', 'equipment_purchase', 'miscellaneous')),
  expense_date date not null,
  vendor_payee text,
  receipt_attachment text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'clarification_requested')),
  approved_by uuid references public.users(id),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "Users see own expenses, admin sees all" on public.expenses
  for select using (
    submitted_by = auth.uid() or
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'facility_manager'))
  );

create policy "FM and Cleaning can create expenses" on public.expenses
  for insert with check (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'facility_manager', 'cleaning_supervisor'))
  );

create policy "Admin can update expenses" on public.expenses
  for update using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- ============================================
-- 9. Notifications
-- ============================================
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text not null check (type in ('work_order', 'booking', 'supply', 'expense', 'contract', 'system')),
  reference_id uuid,
  reference_type text,
  channel text not null default 'in_app' check (channel in ('in_app', 'email', 'both')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Users see own notifications" on public.notifications
  for select using (user_id = auth.uid());

create policy "Users can update own notifications" on public.notifications
  for update using (user_id = auth.uid());

-- ============================================
-- 10. Auto-create user profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'staff')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- 11. Updated_at trigger
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.users for each row execute function update_updated_at();
create trigger set_updated_at before update on public.facility_areas for each row execute function update_updated_at();
create trigger set_updated_at before update on public.work_orders for each row execute function update_updated_at();
create trigger set_updated_at before update on public.assets for each row execute function update_updated_at();
create trigger set_updated_at before update on public.asset_maintenance_schedules for each row execute function update_updated_at();
create trigger set_updated_at before update on public.vendors for each row execute function update_updated_at();
create trigger set_updated_at before update on public.contracts for each row execute function update_updated_at();
create trigger set_updated_at before update on public.vendor_payments for each row execute function update_updated_at();
create trigger set_updated_at before update on public.space_bookings for each row execute function update_updated_at();
create trigger set_updated_at before update on public.supply_requests for each row execute function update_updated_at();
create trigger set_updated_at before update on public.expenses for each row execute function update_updated_at();

-- ============================================
-- 12. Seed data — Facility Areas
-- ============================================
insert into public.facility_areas (name, type, capacity, key_features, is_bookable) values
  ('Main Auditorium', 'Event / Assembly', 200, 'AV equipment, stage, tiered seating', true),
  ('Cafeteria', 'Food Service / Gathering', 80, 'Kitchen access, seating, serving counters', true),
  ('Basketball Court', 'Sports / Recreation', 50, 'Full court, LED lighting, equipment storage', true),
  ('Open Terrace', 'Outdoor / Flexible', 100, 'Covered area, power outlets, flexible seating', true),
  ('Whole Facility', 'Compound-wide', 500, 'Full building booking for large-scale events', true);
