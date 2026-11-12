-- Batches — rented devices arrive together and go back together. One row per
-- rental batch, with the period we hold it and the vendor's contact.
-- Run this in the Supabase SQL editor (or with `supabase db push`).

create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  code text not null, -- the batch number, e.g. 'BATCH-01'
  vendor_name text not null, -- who the devices are rented from
  starts_on date not null,
  ends_on date not null,
  vendor_phone text not null,
  created_at timestamptz not null default now(),
  unique (user_id, code),
  check (ends_on >= starts_on)
);

alter table public.devices
  add column if not exists batch_id uuid
    references public.batches (id) on delete set null;

create index if not exists devices_batch_idx
  on public.devices (batch_id);

alter table public.batches enable row level security;

drop policy if exists "batches_all_own" on public.batches;
create policy "batches_all_own"
  on public.batches for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
