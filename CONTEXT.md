# Context — Darukaa Device Tracker

> Working folder: `darukaa-app/` · Last updated: 2026-11-10
> This file is the handoff memory of the session. Read it before continuing any work here.

## What this folder is

- `Information.md` + `images/` — extraction of the Darukaa.Earth field-worker app docs (17 screenshots): 3-phase field workflow (Deployment / Monitoring / Retrieval), checklists, AI flora/fauna logging, tech stack.
- `device-tracker/` — **standalone MVP** of the QR device-tracking module (React + Vite + TS, all data mocked in localStorage). Built to be lifted into the real app later.
- `expense-tracker/` — the deployed "Darukaa Expenses" project (Next.js 16 + Supabase + Vercel). This becomes the host for the device module → the whole thing becomes the **Operations** project.

## The device-tracking idea (decided in this session)

Devices (AudioMoth ARUs, camera traps, SD cards) get a laminated QR label encoding just the device ID (e.g. `AUDIO-001`). Field workers scan:

- **Deployment scan** → device marked **Occupied**, bound to the site ID (scan-to-bind).
- **Retrieval scan** → device marked **Unoccupied** (site binding cleared).
- **Damage** → status **Damaged**, note required; repair returns it to Available.

Roles: **workers write (scan → status), admins read (inventory)**. The inventory list is admin-only — field workers never see the whole database. Unknown QR → "not registered — contact the office" (the app never creates devices from a scan).

## Decisions made

| Decision | Choice | Why |
|---|---|---|
| Platform | Module inside the existing React web app, not a new app | One codebase, shared auth |
| Scan-to-bind vs plain status | Bind to site | Device↔site history comes free |
| Offline | Online-only for MVP | Field sites sync later; avoids queue complexity |
| Backend | Mocked (localStorage) for MVP | Real API comes with integration |
| Inventory access | Admin-only, same database | Separate DB/app = two sources of truth; role-gate instead |

## device-tracker/ state (standalone MVP)

- `src/module/logic.ts` — pure state machine (available → deployed → available; damage/repair), assert self-check in `selfcheck.ts` (`npm run check`).
- `src/module/store.ts` — **the only persistence point**; swap this file for real API calls when integrating.
- Views: `ScanView` (html5-qrcode camera scan + manual ID fallback), `DeviceView` (status actions + history), `ListView` (admin inventory), `LabelsView` (printable QR labels).
- Role gating: header pill toggles Field Worker ⇄ Project Manager; Inventory/Labels only render for PM. Mock for real RBAC.
- Dev servers: HTTP on :5174 (preview), HTTPS on :5173 (`DK_HTTPS=1`, for phone camera). Camera requires HTTPS (or localhost).
- Bugs found & fixed: StrictMode double-stop crash of the scanner; stale device state after actions; scanner teardown on unrelated re-renders; double `stop()` throwing on scan (blank page) → fixed with `safeStop()` + `foundRef`; `ErrorBoundary` added so crashes show a message.

## Next step (agreed direction)

Move the device module into `expense-tracker/` and rename the effort to **Darukaa Operations** — the expenses project is already deployed (Vercel) and connected to Supabase, so it is the natural home: one auth, one database, one deployment. See `INTEGRATION-PLAN.md`.
