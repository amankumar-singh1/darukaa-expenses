-- Darukaa Expenses — performance indexes
-- Run after the initial schema. Fixes unindexed foreign keys reported by Supabase Advisors.

-- Covers the foreign key from attachments.user_id -> profiles.id.
create index if not exists attachments_user_idx
  on public.attachments (user_id);

-- Covers the foreign key from expenses.category_id -> categories.id.
create index if not exists expenses_category_idx
  on public.expenses (category_id);
