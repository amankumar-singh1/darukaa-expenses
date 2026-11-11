-- Devices are identified by their code alone — drop the separate name column.
-- Run this in the Supabase SQL editor (or with `supabase db push`).

alter table public.devices drop column if exists name;
