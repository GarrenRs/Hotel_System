> **Type:** Implementation Phase | **ID:** Phase 4 | **Status:** CLOSED | **Superseded By:** Phase 8

# Phase 4 — Realistic, Self-Renewing Seed Data

Per-session seeding shared between the demo init route and the local seed CLI, with relative dates and realistic, brand-neutral content.

## What changed

- **`lib/seed.ts` (new)** — exports `seedDemoData(sessionId: string)` (and `LOCAL_DEV_SESSION_ID`). It is idempotent for a session (deletes that session's existing `Room`/`Reservation` rows first), then:
  - Creates **13 `Room` rows** for the session: realistic numbers (`101–104`, `201–203`, `301–303`, `401–402`, `501`) in a believable non-uniform mix across all five `ROOM_TYPES_LIST` categories (STANDARD_DOUBLE ×5, DELUXE_SUITE ×3, EXECUTIVE_SUITE ×2, FAMILY_SUITE ×2, ROYAL_SUITE ×1) and a non-uniform status mix (**9 AVAILABLE, 2 OCCUPIED, 1 CLEANING, 1 MAINTENANCE**). Rooms share the session-scoped, idempotent semantics of Phase 3 (room numbers repeat across sessions by design; there is no cross-session room conflict).
  - Creates **8 `Reservation` rows** for the session: 6 `CONFIRMED`, 1 `PENDING`, 1 `CANCELLED`. All stays link to a seeded room by `roomId` with no overlapping dates on the same room. Booking references (`reservationId`) are generated in the same `HB-2026-XXXX` format the service uses, but are random and **deduped against existing rows** so two sessions never collide on the globally-unique `reservationId` (would otherwise throw `P2002`).
  - **All dates are computed relative to `new Date()`** at seed time (`stayDate(offset)`), spread across a realistic mix: completed stays (−14/−10 and −7/−4 days), currently in-house stays (−2/+3 and −1/+5 days, matching the two `OCCUPIED` rooms), upcoming stays (+5/+8, +10/+14), one pending future stay, and one cancelled stay.
- **`prisma/seed.ts`** — reduced to a thin CLI wrapper: clears the whole database (local-dev convenience), calls the same shared `seedDemoData(LOCAL_DEV_SESSION_ID)` (`'local-dev-seed-session'`), and logs `Seeding local development database...` / `Local development seed completed successfully.` (no "test" wording). Runs via the existing `npx prisma db seed` (`prisma.seed` config in `package.json` — unchanged).
- **`app/api/demo/init/route.ts`** — the Phase 3 "no rows created yet" placeholder now calls `seedDemoData(sessionId)` for the visitor's new session, logging `Demo session seeded` on success and `Demo session seeding failed` on error. Seeding is best-effort: the route still returns the 200 "session ready" response even if seeding fails, so a new visitor is never blocked.
- Guest names, phones, emails, and booking notes in the seed are entirely rewritten to be realistic, professional, international, and **brand-neutral** — no "Test", "Lorem", "Client X", "Demo Room 1", and no reference to the original hotel's name/address/phone. `config/hotel.ts` branding is untouched (owned by Phase 6).

## Why

Every Phase 3 visitor session started with an empty hotel — the dashboard and rooms views read as a blank test instance, and the seed content still looked like fixture data dating from the original single-hotel project. Wiring seeding into the session-init hook means **every new prospect's demo is born already populated** with a realistic, active-looking property: rooms across all categories, guests in-house, recent completed stays, and upcoming bookings. Relative dates keep the data "self-renewing" against the 24h cleanup: each session's dashboard always looks current no matter when it is created. Sharing one function between the API route and the CLI keeps local development behavior identical to production seeding and removes the drift risk of two parallel data sets.

## How to verify

1. **Schema/types/lint (done)** — `npx tsc --noEmit` passes with zero errors (this also closes the pre-existing `prisma/seed.ts:74` item, since seeding now always sets `sessionId`). `npm run lint` reports no new errors (only the two pre-existing `catch (err: any)` errors in `login/page.tsx:45` and `BookingForm.tsx:50`).
2. **New visitor session end-to-end (done)** — hitting the app with no cookie created a fresh `demo_session_id`, the middleware fired `/api/demo/init`, and that session received **13 rooms and 8 reservations**; reservation dates were relative to "today" with a past/current/future mix, statuses `CONFIRMED×6/PENDING×1/CANCELLED×1`, and all reservations linked to rooms with no date overlaps.
3. **Two-session independence (done)** — a second fresh visitor session received its own 13 rooms and 8 reservations; the two sessions' reservation-row IDs did not overlap, and a cross-session `GET /api/reservations/<other-session-id>` returned 404.
4. **CLI seed (done)** — `npx prisma db seed` ran `prisma/seed.ts`, cleared the DB, seeded the fixed `local-dev-seed-session` with 13 rooms and 8 reservations, and exited 0.
5. **Realism review (done)** — generated stays read like a live hotel (e.g. "Fatima Al-Hassan | CONFIRMED | 2026-09-05 -> 2026-09-10 | room 101"), and a repo scan of the seed sources finds none of: "test", "Lorem", "Client X", "Demo Room", or the original hotel's name/email.
6. **Cleanup (done)** — all rows created during verification (sessions A, B, and the `local-dev-seed-session`) were deleted afterward; the demo database was left at its pre-test state (0 rooms / 0 reservations).

## Environment variables added or changed

- None. Seeding uses the existing `DATABASE_URL` via `@/lib/prisma`; the CLI is invoked as `npx prisma db seed` exactly as before.

## Rollback

1. Restore the pre-Phase-4 `app/api/demo/init/route.ts` (log-only placeholder, zero rows created).
2. Restore the old `prisma/seed.ts` (fixed-date sample reservations, "test" wording — Phase 1 data shape, now missing required `sessionId`).
3. Delete `lib/seed.ts` and remove its imports from `prisma/seed.ts` and `app/api/demo/init/route.ts`.
4. Delete `docs/phases/phase-4-seed.md` and revert the Phase Tracker in `docs/PROJECT_STATE.md`.