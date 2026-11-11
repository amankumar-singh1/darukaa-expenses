-- Projects — where devices get deployed. A device optionally belongs to one project.
-- Run this in the Supabase SQL editor (or with `supabase db push`).

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.devices
  add column if not exists project_id uuid
    references public.projects (id) on delete set null;

create index if not exists devices_project_idx
  on public.devices (project_id);

alter table public.projects enable row level security;

drop policy if exists "projects_all_own" on public.projects;
create policy "projects_all_own"
  on public.projects for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
