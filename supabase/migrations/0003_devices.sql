-- Devices — QR-tracked field equipment (AudioMoths, camera traps, SD cards).
-- Run this in the Supabase SQL editor (or with `supabase db push`).

create table if not exists public.devices (
  code text primary key, -- the device ID printed in the QR, e.g. 'AUDIO-001'
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  type text not null,
  status text not null default 'available'
    check (status in ('available', 'occupied', 'damaged')),
  note text, -- set when a device is marked damaged
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists devices_user_status_idx
  on public.devices (user_id, status);

drop trigger if exists devices_set_updated_at on public.devices;
create trigger devices_set_updated_at
  before update on public.devices
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.devices enable row level security;

drop policy if exists "devices_all_own" on public.devices;
create policy "devices_all_own"
  on public.devices for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
