-- Darukaa Expenses — initial schema
-- Run this in the Supabase SQL editor (or with `supabase db push`).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  currency char(3) not null default 'INR',
  gstin text,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  color text not null default '#009245',
  icon text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null default 'INR',
  expense_date date not null default current_date,
  category_id uuid references public.categories (id) on delete set null,
  vendor text,
  payment_method text check (
    payment_method is null
    or payment_method in ('cash', 'upi', 'card', 'bank', 'other')
  ),
  note text,
  invoice_number text,
  tax_amount_minor bigint check (
    tax_amount_minor is null
    or (tax_amount_minor >= 0 and tax_amount_minor <= amount_minor)
  ),
  client_project text,
  is_billable boolean not null default false,
  status text not null default 'recorded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0),
  created_at timestamptz not null default now(),
  unique (storage_path)
);

create index if not exists expenses_user_date_idx
  on public.expenses (user_id, expense_date desc)
  where deleted_at is null;

create index if not exists expenses_user_category_idx
  on public.expenses (user_id, category_id);

create index if not exists attachments_expense_idx
  on public.attachments (expense_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at
  before update on public.expenses
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- New user: profile + default categories
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;

  insert into public.categories (user_id, name, color)
  values
    (new.id, 'Food & Dining', '#009245'),
    (new.id, 'Travel', '#3B82F6'),
    (new.id, 'Office & Supplies', '#F97316'),
    (new.id, 'Software & Subscriptions', '#8B5CF6'),
    (new.id, 'Utilities', '#FEBC2E'),
    (new.id, 'Rent', '#0E2A1D'),
    (new.id, 'Marketing', '#E5484D'),
    (new.id, 'Professional Services', '#14B8A6'),
    (new.id, 'Health', '#EC4899'),
    (new.id, 'Other', '#94A3B8')
  on conflict (user_id, name) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Backfill for users created before this migration
-- ---------------------------------------------------------------------------

insert into public.profiles (id, full_name)
select
  id,
  coalesce(
    nullif(raw_user_meta_data ->> 'full_name', ''),
    split_part(email, '@', 1)
  )
from auth.users
on conflict (id) do nothing;

insert into public.categories (user_id, name, color)
select p.id, defaults.name, defaults.color
from public.profiles p
cross join (
  values
    ('Food & Dining', '#009245'),
    ('Travel', '#3B82F6'),
    ('Office & Supplies', '#F97316'),
    ('Software & Subscriptions', '#8B5CF6'),
    ('Utilities', '#FEBC2E'),
    ('Rent', '#0E2A1D'),
    ('Marketing', '#E5484D'),
    ('Professional Services', '#14B8A6'),
    ('Health', '#EC4899'),
    ('Other', '#94A3B8')
) as defaults(name, color)
on conflict (user_id, name) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.attachments enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "categories_all_own" on public.categories;
create policy "categories_all_own"
  on public.categories for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "expenses_all_own" on public.expenses;
create policy "expenses_all_own"
  on public.expenses for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "attachments_all_own" on public.attachments;
create policy "attachments_all_own"
  on public.attachments for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete
  on public.profiles, public.categories, public.expenses, public.attachments
  to authenticated;

-- ---------------------------------------------------------------------------
-- Private storage bucket: receipts
-- Path convention: {user_id}/{expense_id}/{file_id}.{ext}
-- ---------------------------------------------------------------------------

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'receipts',
  'receipts',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "receipts_select_own" on storage.objects;
create policy "receipts_select_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "receipts_insert_own" on storage.objects;
create policy "receipts_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "receipts_update_own" on storage.objects;
create policy "receipts_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "receipts_delete_own" on storage.objects;
create policy "receipts_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
