-- Batches now record the vendor name alongside their contact number.
-- Safe to run more than once; existing batches start with an empty name.
-- Run this in the Supabase SQL editor (or with `supabase db push`).

alter table public.batches
  add column if not exists vendor_name text not null default '';
