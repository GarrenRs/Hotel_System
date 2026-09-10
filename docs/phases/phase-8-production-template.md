> **Type:** Implementation Phase | **ID:** Phase 8 | **Status:** CLOSED | **Based On:** Phase 7 (continuation) | **Supersedes:** Phase 3, 4, 4b, 4c, 6 (demo layer)

# Phase 8 — Strip Demo Layer, Finalize Production Template

## What changed

The codebase is permanently converted from a self-resetting, per-visitor **demo** into a single-tenant, **production-ready hotel management template**: normal persistent data (no session isolation, no auto-reset, no auto-seeding), no demo presentation elements, no demo-only routes. Every real feature from Phases 1, 2, 5, and 7 is preserved. The owner saved a separate copy of the pre-Phase-8 public demo outside this working directory; nothing demo-only is kept "just in case."

### Task 1 — Session isolation removed (`sessionId`)

- **`prisma/schema.prisma`** — `sessionId` (and its `@@index([sessionId])`) removed from `Room` and `Reservation`. Schema applied via a fresh `prisma db push --force-reset` (no data-preserving migration; there was no real data to preserve).
- **Domain** — `sessionId` removed from `RoomEntity`, `ReservationEntity`, `CreateRoomInput`, `CreateReservationInput`.
- **Repositories** — `repositories/room/*` and `repositories/reservation/*`: all `sessionId` parameters and the session-scoped `assertOwned` removed; collection queries now work against the whole dataset. `hasConflictingReservation` keeps the Phase 7 exclusion of `CANCELLED` status unchanged.
- **Services** — `services/room/room.service.ts`, `services/reservation/reservation.service.ts`: `sessionId` parameters removed; reservation-ID allocation (`NP-2026-####` + P2002 retry) unchanged.
- **API routes** — `app/api/reservations/route.ts` (GET/POST), `app/api/reservations/[id]/route.ts` (GET/PATCH/DELETE), `app/api/rooms/route.ts` (GET), `app/api/rooms/[id]/route.ts` (PATCH), `app/api/admin/stats/route.ts`: `getDemoSessionId` removed, no more "Session required." 401s, and no cookies are read anywhere.
  - **Admin-only routes keep Phase 7 `requireAdminAuth`:** `GET /api/reservations`, `GET/PATCH/DELETE /api/reservations/[id]`, `PATCH /api/rooms/[id]`, `GET /api/admin/stats`.
  - **Previously public routes stay callable without any authification and without a cookie:** `GET /api/rooms` and `POST /api/reservations` — a hotel guest on the public site must be able to view rooms and submit a booking request without logging in. They are write-public by design for this single-front-desk product; admin read/write operations are the authenticated surface. (Any future need to gate guest submissions belongs to a separate structural change.)
- **`lib/session.ts`** — reduced to the single `ADMIN_TOKEN_COOKIE` constant. The cookie was renamed `hotel_demo_admin_token` → **`hotel_admin_token`**; `app/api/admin/login/route.ts` and `app/api/admin/logout/route.ts` now reference the constant instead of the raw string. `lib/admin-auth.ts` and `middleware.ts` are untouched in behavior.

### Task 2 — Per-visitor seeding removed

- **Deleted:** `app/api/demo/init/route.ts` and `app/api/demo/cleanup/route.ts` (whole `app/api/demo/` directory).
- **`middleware.ts`** — the `event.waitUntil` background-seed trigger, `DEMO_SESSION_COOKIE` handling, and the session cookie writing are gone. Middleware now does exactly one thing: the Phase 7 admin page guard (verify the `hotel_admin_token` JWT via Edge-safe `crypto.subtle`, redirect `/admin/*` except `/admin/login` → login). Matcher simplified to exclude only static assets.
- **`lib/seed.ts`** — repurposed from `seedDemoData(sessionId)` into **`seedDatabase()`**: a manual, CLI-only seeding tool. No `sessionId` parameter, `LOCAL_DEV_SESSION_ID` removed, not reachable from any HTTP route. Clears the whole dataset first (full replace) and keeps the realistic, brand-neutral Phase 4 content (13 rooms, 8 reservations, relative dates).
- **`prisma/seed.ts`** — thin CLI wrapper updated to call `seedDatabase()`; still runs via `npx prisma db seed`.
- **`lib/env.ts`** — `CRON_SECRET` removed from `REQUIRED_ENV_VARS` (the cleanup cron is gone). `JWT_SECRET` is still required.
- Boot-retry comments in `components/reservation/BookingForm.tsx`, `app/admin/(protected)/dashboard/page.tsx`, `app/admin/(protected)/reservations/page.tsx` updated — they previously referenced per-session background seeding; the retry loop itself is retained as benign launch tolerance. No behavior change.

### Task 3 — Demo presentation layer removed

- **Deleted:** `components/layout/DemoBadge.tsx` and its usage in `app/(public)/layout.tsx` and `app/admin/(protected)/layout.tsx`.
- **`components/admin/AdminLoginCard.tsx`** — the dashed "Demo access" credential box removed entirely (plus the `demoUsername`/`demoPassword` props and the `KeyRound` import). The card still shows logo, login title/subtitle, username/password fields, error banner, and the "secure access" line. A real hotel login must never print its own password on screen.
- **Deleted:** `lib/demo-access.ts`. `app/admin/(auth)/login/page.tsx` now renders `<AdminLoginCard />` with no props.
- **Translation keys removed:** `admin.demoAccess` (`messages/ar/admin.json`, `messages/fr/admin.json`) and `common.demoBadge` (`messages/ar/common.json`, `messages/fr/common.json`).
- `components/providers/LanguageContext.tsx` — locale localStorage key renamed `hotel_demo_locale` → **`hotel_locale`**.

### Task 4 — Config / deployment housekeeping

- **`config/hotel.ts`** — comment block at the top lists every value that must be replaced with the real client's data before deployment (name, address, phones, email, check-in/out, socials, map embed) plus the `public/images/*` photography.
- **`.env.example`** — `CRON_SECRET` removed; remaining four variables (`DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`) documented with instructions and placeholder values (no committed secrets).
- **`docs/reference/deployment.md`** (new) — ordered checklist: env vars, new Supabase `DATABASE_URL` per client, `npx prisma db push` + optional one-time `npx prisma db seed`, replace `config/hotel.ts` + `public/images/*`, pre-launch grep for demo/session residue, post-launch notes.

### Task 5 — Repo-wide sweep

`rg` for `sessionId | demo_session_id | DemoBadge | demo-access | demoAccess | CRON_SECRET | api/demo | demoBadge | hotel_demo | LOCAL_DEV_SESSION_ID | seedDemoData | getDemoSessionId | DEMO_SESSION | orkestrix` across source (excluding `docs/`, `.next/`, `node_modules/`): **zero matches** (a stale `tsconfig.tsbuildinfo` build artifact was deleted; it regenerates harmlessly on `tsc` runs). Admin auth intact: `lib/admin-auth.ts` + middleware guard + `ADMIN_TOKEN_COOKIE` constant in `lib/session.ts`.

## Why

All demo scaffolding existed to make a throwaway, self-resetting multi-visitor showcase. This working copy is now the permanent production template: one hotel, one desk, one dataset, real persistence. Sessions, per-visitor seeding, the demo badge, on-screen credentials, and the cron cleanup all answered a demo need that no longer exists — they actively fought the "real system" pretense (a guest could observe another visitor's temporary world and a reset 24h later). Removing them makes the template deployable as-is per client (see `docs/reference/deployment.md`).

## How to verify

1. **Fresh database, single dataset** — `npx prisma db push --force-reset`, then `npx prisma db seed`. Exactly 13 rooms / 8 reservations exist.
2. **Public flow, no cookie** — `GET /` → 200; `GET /api/rooms` → 200; `POST /api/reservations` (valid body) → **201** with no `Set-Cookie` and no cookie sent. `GET /api/admin/stats` / `GET /api/reservations` / `PATCH /api/rooms/{id}` without a token → **401**; `GET /admin/dashboard` without a token → **307 → /admin/login**.
3. **Admin flow** — `POST /api/admin/login` (real credentials from env) → 200 + `hotel_admin_token` cookie; `/admin/dashboard`, stats, reservations, room PATCH → 200.
4. **Data integrity preserved** — booking that overlaps a CANCELLED stay (room 202) → 201; booking that overlaps a CONFIRMED stay (room 501) → 400 (Phase 7 fix intact).
5. **Persistence** — a created reservation and a room-status flip survive two full server restarts with zero auto-reset; stats stay consistent (verified live: created bookings still present after restart).
6. **No credentials on screen** — `GET /admin/login` HTML contains neither the password nor any demo-access copy.
7. **Static checks** — `npx tsc --noEmit` exits 0; `npm run lint` = 0 errors, 7 warnings (the pre-existing baseline: unused icon imports in `about`/`restaurant`/`settings`, `StatusBadge` + `exhaustive-deps` in `admin/reservations`) — no new warnings.

## Environment variables added/changed

- **Removed:** `CRON_SECRET` (no longer required by `lib/env.ts`; removed from `.env.example`).
- **Unchanged, still required:** `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`.
- **Cookie rename (value, not env):** admin JWT cookie `hotel_demo_admin_token` → `hotel_admin_token`. Any already-saved browser admin session invalidates on upgrade — expected.

## Rollback

- The owner's pre-Phase-8 snapshot preserves the public-demo behavior; restoring it reinstates sessions/seeding/badge/credentials display. In-tree, there is intentionally **no** flag to "turn the demo back on": the code is the production template now.
- For a partial in-tree revert: re-add `sessionId` to the Prisma schema (`db push --force-reset` again), restore `getDemoSessionId`/`lib/session.ts`, session-scoped repository/service signatures and the three session 401s, recreate `/api/demo/init` + `cleanup`, reinstate `middleware.ts` session wiring, restore `seedDemoData(sessionId)`, restore `DemoBadge`/`demo-access`/the login card credential box, and re-add the removed translation keys. Also restore the `hotel_demo_admin_token` cookie name if the browser tokens matter.
- Delete `docs/phases/phase-8-production-template.md` and revert the `docs/reference/deployment.md`/`docs/PROJECT_STATE.md` additions if the phase is rolled back.