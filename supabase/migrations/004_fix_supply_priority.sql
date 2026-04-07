-- ============================================
-- FMS — Expand supply_requests priority values
-- ============================================
-- The original CHECK constraint only allowed ('routine', 'urgent').
-- The UI form offers ('low', 'medium', 'high', 'urgent').
-- This migration expands the constraint to match.

-- Drop the old constraint
alter table public.supply_requests
  drop constraint if exists supply_requests_priority_check;

-- Add the expanded constraint
alter table public.supply_requests
  add constraint supply_requests_priority_check
  check (priority in ('low', 'medium', 'high', 'urgent'));

-- Update the default value to match the new set
alter table public.supply_requests
  alter column priority set default 'medium';

-- Migrate any existing 'routine' values to 'low'
update public.supply_requests
  set priority = 'low'
  where priority = 'routine';
