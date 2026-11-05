# Darukaa Expenses

A private expense tracker for a single business user. Every expense can carry invoice proof (images or PDFs) in a private storage bucket.

Built with Next.js 16 (App Router), Supabase (Postgres + Auth + Storage), Tailwind CSS 4, and shadcn-style components. Designed for Vercel.

## Features (v1)

- Email + password authentication, including email confirmation and password reset.
- Add, edit, and soft-delete expenses.
- Fields: name, amount (stored in paise), date, category, vendor, payment method, note.
- Optional business fields: invoice number, GST/tax amount, client/project, billable flag.
- Multiple invoice files per expense (PDF, JPG, PNG, WebP, HEIC), compressed in the browser.
- Invoice viewing through short-lived signed URLs from a private bucket.
- Expense list with search and category filter.
- Dashboard with monthly total, proof coverage, category breakdown, and recent expenses.
- Category management (add, archive, restore) with sensible defaults.
- INR formatting throughout, with Manrope + JetBrains Mono typography.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router, TypeScript |
| Database | Supabase Postgres with Row Level Security |
| Auth | Supabase Auth (email/password) |
| Storage | Supabase Storage, private `receipts` bucket |
| UI | Tailwind CSS 4, custom shadcn-style components |
| Validation | Zod |
| Deploy | Vercel |

## Local setup

### 1. Install

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project. Choose the Mumbai region if you are in India.
2. Open **SQL Editor** and run the contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). This creates the tables, RLS policies, default categories, the profile trigger, and the private `receipts` storage bucket.
3. In **Authentication → Providers → Email**, keep email/password enabled.
4. In **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/**`
     - `https://your-app.vercel.app/**` (add after deploying)
5. Copy **https://uiosxznztexirjxpqfzk.supabase.co** and **sb_publishable_qLBTUQLshXfMpLCOUvRdfQ_bJydlQNu** from **Project Settings → API**.

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The anon key is safe in the browser; RLS protects the data. Never put the `service_role` key in this app.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, confirm the email, and sign in.

> In Supabase's built-in email service, confirmation emails are rate-limited and may land in spam. For production, configure a custom SMTP provider under **Authentication → SMTP Settings**.

### Cross-device email links (recommended)

Supabase's default email link uses the PKCE flow, which expects the link to be opened in the same browser that started the flow. If you usually open email on your phone, update **Authentication → Email Templates** to the token-hash pattern:

- **Confirm signup:**
  `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup&next=/dashboard`
- **Reset password:**
  `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`

The callback route already supports both the code exchange and token-hash verification.

## How uploads work

Uploads go **directly from the browser to Supabase Storage**, not through a Vercel function. Vercel functions cap request bodies at 4.5 MB, so routing files through them would fail on phone photos.

1. Images over 1.2 MB are compressed in the browser (max 2200 px, JPEG quality 0.82).
2. The file is uploaded to `{user_id}/{expense_id}/{uuid}.{ext}`.
3. Storage RLS rejects any path whose first folder is not the signed-in user's ID.
4. The expense + attachment metadata are saved together by a server action.
5. Viewing uses a 10-minute signed URL.

Limits: 5 files per expense, 10 MB per file.

## Database notes

- Money is stored as integer **paise** (`amount_minor`, `tax_amount_minor`), never floats.
- `expense_date` is separate from `created_at`.
- Deletes are soft (`deleted_at`) so records are recoverable. Files are kept for now; a cleanup job can purge old soft-deleted rows later.
- All four tables have RLS scoped to `auth.uid()`.
- The `handle_new_user` trigger creates a profile and ten default categories on signup.

## Project structure

```
src/
  app/
    (auth)/            login, signup, forgot/reset password
    (app)/             authenticated shell
      dashboard/       monthly overview
      expenses/        list, detail, new, edit, server actions
      categories/      category management
      settings/        profile + GSTIN
    auth/callback/     Supabase code exchange / OTP verification
  components/          UI primitives, sidebar, forms, uploader
  lib/                 Supabase clients, validation, money, upload helpers
  middleware.ts        session refresh + route protection
supabase/migrations/   SQL schema, RLS, storage policies
```

## Deploy to Vercel

1. Push the repo to GitHub.
2. Import it into Vercel.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to **Production** and **Preview** environments.
4. Set the function region to Mumbai (`bom1`) if your Supabase project is in Mumbai.
5. Deploy, then add `https://your-app.vercel.app/**` to Supabase **Redirect URLs**.
6. Test signup, login, image upload, and PDF viewing on a real phone.

Use a separate Supabase project for development and production. Preview deployments should not write to production data.

## Free-tier limits

Supabase free tier includes roughly 500 MB of database and 1 GB of storage. With compressed receipts, that is around 1,000+ invoices. Add a weekly database export once you rely on it — the free tier has no point-in-time recovery.

## Roadmap

- M4: CSV export, better pagination, month picker, saved filters.
- M5: production deploy, phone testing, error monitoring.

- M6: OCR prefill, budgets, recurring expenses, charts, duplicate detection, PWA.
