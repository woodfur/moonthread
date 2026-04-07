-- ============================================
-- FMS — Consumption Tracking Tables
-- ============================================
-- Creates tables for tracking consumable item inventory
-- and consumption/restocking log entries.

-- 1. Consumable Items
create table public.consumable_items (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text not null check (category in ('water', 'cleaning', 'office', 'kitchen', 'hygiene', 'other')),
  unit text not null default 'pieces',
  current_stock integer not null default 0,
  reorder_threshold integer not null default 5,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.consumable_items enable row level security;

create policy "Anyone can read consumable items" on public.consumable_items
  for select using (true);

create policy "FM, Admin, and Cleaning can manage consumable items" on public.consumable_items
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'facility_manager', 'cleaning_supervisor'))
  );

-- 2. Consumption Logs
create table public.consumption_logs (
  id uuid default uuid_generate_v4() primary key,
  item_id uuid references public.consumable_items(id) on delete cascade not null,
  logged_by uuid references public.users(id) not null,
  action text not null check (action in ('consumed', 'restocked')),
  quantity integer not null default 1,
  area_id uuid references public.facility_areas(id),
  notes text,
  logged_at timestamptz not null default now()
);

alter table public.consumption_logs enable row level security;

create policy "Anyone can read consumption logs" on public.consumption_logs
  for select using (true);

create policy "Authenticated users can create consumption logs" on public.consumption_logs
  for insert with check (logged_by = auth.uid());

-- 3. Auto-update timestamps
create trigger set_updated_at before update on public.consumable_items
  for each row execute function update_updated_at();
