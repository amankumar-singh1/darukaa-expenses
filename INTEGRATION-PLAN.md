# Integration Plan — Device Tracker → Darukaa Operations

> Host: `expense-tracker/` (Next.js 16 App Router · Supabase Auth + Postgres RLS + Storage · Vercel).
> Verdict: **the idea is right.** The expenses project is already deployed and working — adding a Devices module there (instead of a new app) gives one login, one database, one deployment. Renaming the effort to "Darukaa Operations" is cosmetic; no code impact.

## Principles

1. **One database.** Devices live in the same Supabase Postgres as expenses. Never a separate inventory DB.
2. **One app, two sections.** Sidebar gains "Devices" next to Expenses. Admin-only pages are enforced by RLS + server-side role check, not just hidden UI.
3. **Workers write, admins read.** Field workers scan → status changes. Admins see the full inventory.
4. **The camera needs HTTPS** — Vercel provides it, so scanning works on phones with zero extra setup.

## 1. Database (Supabase migration `0003_devices.sql`)

```sql
-- roles on the existing profiles table; current user becomes admin
alter table public.profiles
  add column if not exists role text not null default 'admin'
  check (role in ('admin', 'field_worker'));

create table if not exists public.devices (
  id text primary key,                -- the QR value, e.g. 'AUDIO-001'
  type text not null,                 -- 'AudioMoth ARU' | 'Camera Trap' | 'SD Card' | ...
  status text not null default 'available'
    check (status in ('available', 'deployed', 'damaged')),
  site_id text,                       -- set on deploy, cleared on retrieve/damage
  damaged_note text,
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.device_events (
  id uuid primary key default gen_random_uuid(),
  device_id text not null references public.devices (id) on delete cascade,
  action text not null check (action in ('deploy', 'retrieve', 'damage', 'repair')),
  site_id text,
  note text,
  actor uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index if not exists device_events_device_idx on public.device_events (device_id, created_at desc);
```

**RLS policies** (the real access control):

- `devices` SELECT: authenticated users (workers need to look up the one device they scanned).
- `devices` UPDATE (status/site_id/damaged_note): authenticated users — this is the scan write path.
- `devices` INSERT / DELETE: `role = 'admin'` only (device registry is office work).
- `device_events` SELECT + INSERT: authenticated users (per-device history; admin clears up later).
- Run migration in the Supabase SQL editor, then seed the real device list (`insert into public.devices ...`).

Known trade-off to accept for MVP: a worker could technically read devices via API one-by-one. Fine for now; if it ever matters, move the lookup into a `security definer` RPC `get_device_by_qr(text)`.

## 2. App structure (Next.js, inside `src/`)

Port from `device-tracker/` with minimal change:

| From standalone MVP | Becomes |
|---|---|
| `src/module/logic.ts` | `src/lib/devices/logic.ts` — unchanged (pure, already self-checked) |
| `src/module/store.ts` | `src/lib/devices/actions.ts` — server actions calling Supabase (`runDeviceAction` inserts event + updates device in one transaction-ish flow) |
| `src/module/ScanView.tsx` | `src/app/(app)/devices/scan/scan-view.tsx` — `'use client'`, html5-qrcode + manual fallback, same `safeStop`/ref pattern (the bugs are already fixed there) |
| `src/module/DeviceView.tsx` | `src/app/(app)/devices/[id]/page.tsx` + small client form; history from `device_events` |
| `src/module/ListView.tsx` | `src/app/(app)/devices/inventory/page.tsx` — **admin-gated** |
| `src/module/ListView.tsx` | `src/app/(app)/devices/labels/page.tsx` — admin-only, `qrcode` package, print CSS |

New dependency: `html5-qrcode` (scan) and `qrcode` (labels) — same as the MVP. Everything else (Tailwind, UI components, auth, Supabase clients) already exists in the host app.

Routes & gating:

- `/devices/scan` — any authenticated user (field worker's default screen).
- `/devices/[id]` — any authenticated user (status actions + history).
- `/devices/inventory`, `/devices/labels` — server component checks `profiles.role = 'admin'`, otherwise `redirect('/devices/scan')`.
- `AppSidebar`: add "Devices" (all users) and "Inventory" (admin only). `requireUser()` already fetches the user; extend it to return `profile.role` too.

## 3. Work order

1. Migration `0003_devices.sql` + RLS in Supabase SQL editor; seed real devices.
2. `profiles.role` surfaced through `requireUser()`; sidebar links.
3. Port `logic.ts` (+ keep `npm run check`-style self-check for the state machine).
4. Server actions (`deploy/retrieve/damage/repair`) with Zod validation, matching the house pattern in `expenses/actions.ts`.
5. Worker flow: scan page → device page. Test on phone via the Vercel URL.
6. Admin flow: inventory list + labels.
7. Deploy (git push → Vercel). Smoke-test on mobile HTTPS.

## 4. Explicitly not in this round

Offline scan queue, worker management of the device registry (admin form), battery/maintenance workflows, notifications on damage, GPS capture on scan (the site binding already gives location). Revisit after field feedback.

## Risks

- The host app is currently single-user; adding worker accounts means confirming which Supabase auth emails map to which role (default role is `field_worker` for new signups if you flip the default — decide before inviting workers).
- QR labels will fade in rain/UV — laminate them; the QR carries only the ID, so a reprint never loses data.
