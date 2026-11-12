-- Employees — people on the team, optionally deployed to one project.
-- Full-time staff have no leaving date (leaves_on = null).
-- Run this in the Supabase SQL editor (or with `supabase db push`).

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  phone text not null,
  joined_on date not null,
  leaves_on date, -- null while they are full time / still with us
  is_full_time boolean not null default false,
  project_id uuid references public.projects (id) on delete set null,
  created_at timestamptz not null default now(),
  check (leaves_on is null or leaves_on >= joined_on)
);

create index if not exists employees_project_idx
  on public.employees (project_id);

create index if not exists employees_user_idx
  on public.employees (user_id);

alter table public.employees enable row level security;

drop policy if exists "employees_all_own" on public.employees;
create policy "employees_all_own"
  on public.employees for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
