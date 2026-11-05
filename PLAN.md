# Expense Tracker — Product & Technical Plan

> Goal: a fast, mobile-friendly expense tracker where every expense can have an invoice/receipt as proof.
> Deploy target: Vercel. Status: M1–M3 implemented locally; Supabase credentials and M4–M5 remain.

---

## 1. What you asked for

| Feature | Notes |
|---|---|
| Expense name | Short label, e.g. "Cab to airport" |
| Amount | Must store money safely (not floats) |
| Note | Free text |
| Invoice upload (proof) | Image or PDF attached to the expense |
| Online + Vercel | Managed DB + file storage required |

That is a solid core. Below is what is missing before it is actually usable and safe to deploy.

---

## 2. Gaps in the current spec (read this first)

### Critical — the app will break or leak data without these

1. **Authentication / multi-user support.**
   Without login, every visitor sees and edits the same expenses. Even for personal use, auth protects your data. Add email magic-link + Google sign-in.

2. **File storage is NOT the Vercel filesystem.**
   Vercel Functions are stateless/ephemeral. Files written to `./uploads` disappear on the next deploy or cold start. You need object storage (Supabase Storage, Vercel Blob, S3, R2). Also, Vercel Functions cap request bodies at **4.5 MB**, so uploads must go **directly from the browser to storage**, not through an API route.

3. **Money as float.**
   `0.1 + 0.2 !== 0.3`. Store integer minor units (`amount_minor BIGINT`, paise/cents) or `NUMERIC(12,2)`. Format only at display time.

4. **Expense date vs. created date.**
   You need `expense_date` (when the money was spent) separate from `created_at` (when it was entered). People log old receipts.

5. **Currency.**
   Pick a default (INR) but store `currency` per expense so you are not stuck later. Do not add multi-currency conversion in MVP.

6. **Edit / delete.**
   Typos happen. Soft-delete (`deleted_at`) so data is recoverable, and allow editing all fields + replacing attachments.

7. **Authorization, not just authentication.**
   Every query and every file must be scoped to the logged-in user. Use Postgres **Row Level Security (RLS)** plus storage policies. Never trust an `expense_id`/`user_id` sent by the client.

8. **Upload validation.**
   Limit type (PDF, JPEG, PNG, WebP), size (e.g. 10 MB/file), count (e.g. 5/expense). Validate extension + MIME + magic bytes server-side. Reject HTML/SVG/executables. iPhone HEIC files cannot be previewed in most browsers — either convert client-side or show a clear "download" fallback.

9. **Private files.**
   Receipts contain sensitive data. Bucket must be **private**; view via short-lived signed URLs, never public links.

### High — the app feels incomplete without these

10. **Categories** (Food, Travel, Bills, Shopping, Health, Other) + custom categories. This is what makes totals useful.
11. **List with search, date-range/category filters, sorting, pagination.** An expense list becomes unusable after ~100 rows.
12. **Monthly dashboard**: total spent, count, top categories, recent expenses. This is the reason people open the app.
13. **CSV export** (and ideally import). Users distrust apps they cannot leave; also useful for taxes/expense claims.
14. **Multiple attachments per expense.** A bill can be 2 pages; a payment screenshot + invoice is common.
15. **Vendor/merchant + payment method** (cash, UPI, card, bank). Cheap to add now, painful to backfill.
16. **Mobile camera capture** (`<input type="file" accept="image/*" capture="environment">`) — most receipts are photographed.
17. **Loading, empty, error, and success states** + form validation messages.
18. **Migrations + backups.** Keep schema in versioned SQL migrations. Supabase free tier has no point-in-time recovery — schedule a weekly export.
19. **Secrets handling.** Service-role key must never reach the browser. Only `NEXT_PUBLIC_*` values are public.
20. **Separate dev and prod databases.** Vercel preview deployments can otherwise write to production data.

### Medium — good differentiators, phase 2

21. Budgets per category/month with progress + alerts.
22. Charts (monthly trend, category breakdown).
23. Recurring expenses (rent, subscriptions) via cron.
24. OCR: read the receipt and prefill amount/date/vendor. Very high perceived value for this exact app.
25. Duplicate detection (same file hash or same amount+vendor+date).
26. Tags / custom fields.
27. PWA install + offline draft + share-to-app receipt capture.
28. Bank/card CSV import with column mapping.
29. Tax fields (GSTIN, CGST/SGST, HSN) if used for business/ITR.
30. Reimbursement status / team approval workflow.
31. Audit log ("who changed what").
32. Legal pages, privacy policy, account deletion (required if public).
33. Error monitoring (Sentry) + product analytics.
34. Accessibility, dark mode, keyboard shortcuts.

---

## 3. Recommended architecture

**Stack (smallest number of vendors, free-tier friendly):**

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router, latest)** + TypeScript | Native Vercel support, server components + server actions |
| UI | Tailwind CSS + shadcn/ui | Fast, accessible, consistent |
| Forms | react-hook-form + Zod | Shared client/server validation |
| Database | **Supabase Postgres** | Managed Postgres, free tier, Mumbai region available |
| Auth | **Supabase Auth** | Email OTP + Google, same vendor/DB |
| File storage | **Supabase Storage (private bucket)** | RLS-scoped, signed URLs, direct browser upload |
| Charts | Recharts | Simple React charts |
| Dates/money | date-fns + integer minor units | No timezone/float bugs |
| Deploy | **Vercel** | Requested |
| Monitoring | Sentry (free tier) | Catch production errors |

Alternatives if you prefer Vercel-only: Neon Postgres + Auth.js + Vercel Blob. More moving parts; Supabase is less wiring for this scope.

> Do **not** use Vercel Postgres/Blob just because it is Vercel-native — either is fine, but pick one storage vendor and one DB vendor, not three.

---

## 4. Data model

```
profiles
  id            uuid PK = auth.users.id
  full_name     text
  currency      char(3) default 'INR'
  gstin         text null
  created_at    timestamptz

categories
  id            uuid PK
  user_id       uuid FK profiles  (null = system default)
  name          text
  color         text
  icon          text
  is_archived   boolean default false
  created_at    timestamptz

expenses
  id            uuid PK (client-generated UUID is fine)
  user_id       uuid FK profiles
  name          text not null
  amount_minor  bigint not null check (amount_minor > 0)
  currency      char(3) not null default 'INR'
  expense_date  date not null default current_date
  category_id   uuid FK categories null
  vendor        text null
  payment_method text null        -- cash | upi | card | bank | other
  note          text null
  invoice_number text null        -- business: vendor bill no.
  tax_amount_minor bigint null    -- business: GST portion
  client_project text null        -- business: who it is for
  is_billable   boolean default false
  status        text default 'recorded'  -- phase 2: reimbursable/reimbursed
  created_at    timestamptz
  updated_at    timestamptz
  deleted_at    timestamptz null  -- soft delete

attachments
  id            uuid PK
  expense_id    uuid FK expenses on delete cascade
  user_id       uuid FK profiles
  storage_path  text   -- {user_id}/{expense_id}/{uuid}.{ext}
  file_name     text
  mime_type     text
  size_bytes    integer
  sha256        text null  -- duplicate detection, phase 2
  created_at    timestamptz

-- phase 2
budgets (id, user_id, category_id, period_start date, amount_minor, currency)
```

Indexes: `expenses(user_id, expense_date desc)`, `expenses(user_id, category_id)`, `attachments(expense_id)`.

**RLS everywhere:** `user_id = auth.uid()` for select/insert/update/delete. Storage policy: first path segment must equal `auth.uid()`.

---

## 5. Upload pipeline (the part most tutorials get wrong)

1. User selects up to 5 files in the form (drag-drop or camera).
2. Client compresses large images (e.g. browser-image-compression, target < 2 MB) and checks type/size.
3. Client generates the expense UUID, then uploads each file **directly to Supabase Storage** at `{userId}/{expenseId}/{fileId}.{ext}` using the user's session. Storage RLS enforces ownership.
4. On submit, a **server action** validates all fields with Zod and inserts the expense + attachment rows in one transaction.
5. If the insert fails, delete the orphaned uploaded files (cleanup job or immediate delete).
6. Viewing: server creates a **60-second signed URL**; images open in a lightbox, PDFs in a new tab.
7. Deleting an expense deletes its attachment rows + storage objects (soft-delete expense, hard-delete files after a grace period, or keep files and only hide).

This bypasses Vercel's 4.5 MB body limit entirely.

---

## 6. Screens (MVP)

| Route | Purpose |
|---|---|
| `/login` | Email magic link + Google |
| `/` or `/dashboard` | Month selector, total, count, category breakdown, recent 5, "Add expense" CTA |
| `/expenses` | Searchable/filterable table or card list, pagination |
| `/expenses/new` | Form + upload dropzone + camera |
| `/expenses/[id]` | Detail, invoice preview, edit, delete |
| `/expenses/[id]/edit` | Same form, existing attachments |
| `/categories` | Add/rename/archive categories |
| `/settings` | Currency, CSV export, account deletion |

Mobile-first: bottom nav or sticky "＋ Add" button; large tap targets; amount input with numeric keypad.

---

## 7. Security checklist

- [ ] RLS enabled on `profiles`, `categories`, `expenses`, `attachments`
- [ ] Storage bucket private; policy restricts path to `auth.uid()`
- [ ] Server actions re-check session + ownership (defense in depth)
- [ ] Zod validation on every mutation
- [ ] Upload MIME/size/count validated server-side
- [ ] No service-role key in client bundle
- [ ] Rate limit auth + upload endpoints (Supabase has built-in auth rate limits; add Upstash if needed)
- [ ] Signed URLs with short TTL; no public bucket
- [ ] Soft delete + confirmation dialogs
- [ ] HTTPS only (Vercel default), security headers
- [ ] Privacy policy + account deletion if public

---

## 8. Vercel deployment plan

1. Create GitHub repo, push Next.js app.
2. Create two Supabase projects: `expense-tracker-dev`, `expense-tracker-prod` (Mumbai region for India latency).
3. Run SQL migrations on both (Supabase CLI or SQL editor). Seed default categories.
4. Set Vercel env vars (Production + Preview separately):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only)
   - `NEXT_PUBLIC_APP_URL`
5. Import repo into Vercel; framework auto-detected. Set function region to `bom1` (Mumbai) if the DB is in Mumbai.
6. Configure Supabase Auth redirect URLs: `http://localhost:3000/**`, `https://your-app.vercel.app/**`, custom domain.
7. Deploy, test the full flow on a real phone (camera upload + PDF view).
8. Add custom domain, Sentry, and Vercel Analytics.
9. Set up a weekly DB export/backup reminder (free tier has no PITR).

**Free-tier reality check:** Supabase free gives ~500 MB DB + 1 GB storage. At ~1 MB/receipt that is roughly 1,000 receipts — fine for MVP, but compress images and plan an upgrade or R2 migration before scaling.

---

## 9. Build order (suggested)

| Milestone | Deliverable |
|---|---|
| M1 | Next.js + Tailwind + shadcn scaffold, Supabase project, auth, protected layout |
| M2 | Schema + migrations + RLS, default categories, expense CRUD with Zod |
| M3 | Direct-to-storage upload, attachments table, signed-URL viewer, delete cleanup |
| M4 | Expenses list (search/filter/pagination), dashboard totals, CSV export |
| M5 | Polish (mobile, empty/error states, toasts), deploy to Vercel, phone test |
| M6 (optional) | Budgets, charts, OCR prefill, recurring |

Ship M1–M5 as v1. Everything else is a follow-up.

---

## 10. Improvement ideas, ranked by value/effort

**High value, low effort**
- OCR prefill from receipt (Google Vision / OpenAI vision / Tesseract.js) — biggest "wow" for this app.
- Duplicate warning on same amount + date + vendor.
- Quick-add presets ("Coffee ₹150").
- Month-over-month comparison on the dashboard.
- CSV export + bank CSV import with column mapping.
- PWA install + camera share target.

**High value, medium effort**
- Budgets with progress bars and threshold alerts.
- Recurring expenses + Vercel Cron.
- Tags and saved filters.
- Email-in receipts (forward to `receipts@yourdomain`).
- Multi-attachment gallery with PDF thumbnails.

**Only if you need it**
- Team workspaces + approval workflow (changes the schema and RLS significantly — decide now, not later).
- Multi-currency with FX rates (needs a rates API and a display-currency policy).
- GST/tax fields for business filing.

---

## 11. Locked decisions (v1)

| Decision | Choice | Effect on the build |
|---|---|---|
| Users | **Single user** (you) | Keep `user_id` + RLS for security, but no team/roles/approval screens |
| Use case | **Business** | Add optional GST/tax fields (see below); no reimbursement workflow |
| Currency | **INR only** | Fixed `INR`; keep the `currency` column for future-proofing, no FX conversion |
| Auth | **Email + password** | Supabase email/password with email confirmation + forgot-password flow |
| OCR | **Later (v2)** | No AI/OCR dependency in v1 |
| Scope | M1–M5 | Ship the core, then reassess |

### Business-use additions (optional fields, still simple)

- `profiles.gstin` — your GSTIN, shown on exports.
- `expenses.invoice_number` — vendor bill number.
- `expenses.tax_amount_minor` — GST portion of the amount.
- `expenses.client_project` — who the expense is for (useful at tax time).
- `expenses.is_billable` — optional flag for client billing.

These are nullable and do not complicate the UI — one collapsible "Business details" section on the form.

**Still out of scope for v1:** team workspaces, approval/reimbursement status, multi-currency, OCR, budgets, recurring expenses.

---

## 12. Brand & theme (from darukaa.earth)

The site uses a nature/forest identity: deep forest green, bright lime accent, warm off-white, Manrope typography, uppercase tracked labels, and clean white product mockups on a dark green backdrop.

### Color tokens

| Token | Hex | Usage |
|---|---|---|
| `forest-950` | `#0A1F16` | Darkest surfaces, overlays |
| `forest-900` | `#0E2A1D` | Sidebar/header, primary text |
| `forest-800` | `#102810` | Hover on dark surfaces |
| `brand-600` | `#009245` | Primary buttons, links, active icons |
| `brand-700` | `#007B3A` | Primary button hover |
| `lime-300` | `#B6F07F` | Accent, highlights, selected states, key amounts |
| `lime-400` | `#A9EE70` | Accent hover |
| `cream-50` | `#FDFBF7` | App page background |
| `ink` | `#101010` | Body text on light surfaces |
| `white` | `#FFFFFF` | Cards, forms |
| `warning` | `#FEBC2E` | Pending / attention |
| `danger` | `#FF5F57` | Delete / errors |

### Typography

- **Manrope** (`400/500/600/700/800`) — all UI text and headings.
- **JetBrains Mono** — amounts, invoice numbers, dates in tables. Gives financial data a precise feel.
- Eyebrow labels: uppercase, `letter-spacing: 0.15em`, small, brand green.
- Headings: tight tracking, weight 600–700; body 400/500.

### UI direction for the expense tracker

- Cream `#FDFBF7` page background, white cards with soft borders and 12–16 px radius.
- Deep forest green sidebar/top bar; lime for the active nav item and "paid/recorded" badges.
- Brand green primary buttons ("Add expense", "Upload invoice"); lime reserved for emphasis so it stays special.
- Amounts in JetBrains Mono, right-aligned in lists; negative/overspend in danger red.
- Receipt thumbnails and PDF previews on white cards with forest-green metadata.
- Auth/landing page can reuse the nature hero imagery; the dashboard stays clean and data-first.
- Logo assets downloaded to `public/brand/darukaa-dark.webp` and `darukaa-white.webp`.

---

## 13. Build status

### Done (M1–M3)

- Next.js 16 project, Tailwind 4 theme, Manrope + JetBrains Mono, brand assets.
- Supabase browser/server clients, `proxy.ts` session refresh and route protection.
- Email/password signup, login, logout, confirmation callback, forgot/reset password.
- SQL migration: profiles, categories, expenses, attachments, indexes, updated-at trigger, new-user trigger, default categories, RLS, private `receipts` bucket + storage policies.
- Expense CRUD with Zod validation, soft delete, business fields.
- Direct-to-storage invoice uploads with client-side image compression, HEIC handling, 5-file/10 MB limits, signed-URL viewing.
- Dashboard, searchable/filterable expense list, detail/edit pages.
- Category management and settings (name, GSTIN, currency).
- Themed login/signup, 404, error boundary, empty states.
- `tsc`, ESLint, and `next build` all pass.

### Remaining

- **M4:** CSV export, pagination, month picker, saved filters.
- **M5:** create Supabase project, run migration, set env vars, deploy to Vercel, test on a phone.
- **M6:** OCR prefill, budgets, charts, recurring expenses, duplicate detection, PWA.

### To run now

1. Create a Supabase project (Mumbai region recommended).
2. Run `supabase/migrations/0001_init.sql` in the SQL editor.
3. Copy `.env.example` to `.env.local` and add the project URL + anon key.
4. Add `http://localhost:3000/**` to Supabase redirect URLs.
5. `npm run dev`.

Full instructions are in `README.md`.
